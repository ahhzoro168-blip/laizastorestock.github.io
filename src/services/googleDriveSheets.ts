import { ShoeProduct, SaleOrder, PurchaseOrder } from '../types';

export interface GoogleSyncResult {
  spreadsheetId: string;
  spreadsheetUrl: string;
  folderId: string;
  folderUrl: string;
  syncedAt: string;
}

export interface LoadedSyncData {
  products: ShoeProduct[];
  orders: SaleOrder[];
  purchaseOrders: PurchaseOrder[];
}

/**
 * Find or create the dedicated SoleTrack folder in the user's Google Drive
 */
export async function ensureSoleTrackDriveFolder(accessToken: string): Promise<{ folderId: string; folderUrl: string }> {
  const query = encodeURIComponent("name = 'SoleTrack Footwear Data & Photos' and mimeType = 'application/vnd.google-apps.folder' and trashed = false");
  const searchRes = await fetch(`https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,webViewLink)`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  if (!searchRes.ok) {
    const err = await searchRes.text();
    console.error('Drive search folder error:', err);
    throw new Error(`Failed to access Google Drive: ${searchRes.statusText}`);
  }

  const searchData = await searchRes.json();
  if (searchData.files && searchData.files.length > 0) {
    const existing = searchData.files[0];
    return {
      folderId: existing.id,
      folderUrl: existing.webViewLink || `https://drive.google.com/drive/folders/${existing.id}`
    };
  }

  // Create folder
  const createRes = await fetch('https://www.googleapis.com/drive/v3/files?fields=id,webViewLink', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: 'SoleTrack Footwear Data & Photos',
      mimeType: 'application/vnd.google-apps.folder',
      description: 'Dedicated storage for SoleTrack shoe inventory pictures and Google Sheets database.'
    })
  });

  if (!createRes.ok) {
    throw new Error(`Failed to create Google Drive folder: ${createRes.statusText}`);
  }

  const created = await createRes.json();
  return {
    folderId: created.id,
    folderUrl: created.webViewLink || `https://drive.google.com/drive/folders/${created.id}`
  };
}

/**
 * Upload an image (base64 data URL) to Google Drive and return accessible link
 */
export async function uploadImageToDrive(
  folderId: string,
  base64DataUrl: string,
  fileName: string,
  accessToken: string
): Promise<{ fileId: string; viewUrl: string }> {
  // If not a data URL (e.g. already an HTTP link), return as-is
  if (!base64DataUrl.startsWith('data:')) {
    return { fileId: '', viewUrl: base64DataUrl };
  }

  const [header, base64Content] = base64DataUrl.split(',');
  const mimeType = header.match(/:(.*?);/)?.[1] || 'image/jpeg';
  
  // Convert base64 to binary byte array
  const byteChars = atob(base64Content);
  const byteNums = new Array(byteChars.length);
  for (let i = 0; i < byteChars.length; i++) {
    byteNums[i] = byteChars.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNums);
  const blob = new Blob([byteArray], { type: mimeType });

  // Prepare multipart body
  const metadata = {
    name: fileName || `shoe-photo-${Date.now()}.jpg`,
    mimeType: mimeType,
    parents: [folderId]
  };

  const boundary = '-------314159265358979323846';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const metaPart = `Content-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}`;
  const mediaHeader = `Content-Type: ${mimeType}\r\nContent-Transfer-Encoding: base64\r\n\r\n`;

  const multipartBody = `${delimiter}${metaPart}${delimiter}${mediaHeader}${base64Content}${closeDelimiter}`;

  const uploadRes = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink,webContentLink,thumbnailLink', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': `multipart/related; boundary=${boundary}`
    },
    body: multipartBody
  });

  if (!uploadRes.ok) {
    console.warn('Drive image upload warning:', await uploadRes.text());
    // Fallback: return original data url if drive upload encounters issue
    return { fileId: '', viewUrl: base64DataUrl };
  }

  const file = await uploadRes.json();

  // Make file publicly readable via link so Google Sheets and UI can display it
  try {
    await fetch(`https://www.googleapis.com/drive/v3/files/${file.id}/permissions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        role: 'reader',
        type: 'anyone'
      })
    });
  } catch (e) {
    console.warn('Could not set public permission on Drive image:', e);
  }

  // Construct direct thumbnail/content url for image display
  const directUrl = `https://drive.google.com/thumbnail?id=${file.id}&sz=w1000`;
  return {
    fileId: file.id,
    viewUrl: directUrl
  };
}

/**
 * Find or create the Google Sheets database for SoleTrack
 */
export async function ensureSoleTrackSpreadsheet(
  folderId: string,
  accessToken: string
): Promise<{ spreadsheetId: string; spreadsheetUrl: string }> {
  // Search for spreadsheet in the Drive folder
  const query = encodeURIComponent(`name = 'SoleTrack Footwear Inventory & Sales' and mimeType = 'application/vnd.google-apps.spreadsheet' and '${folderId}' in parents and trashed = false`);
  const searchRes = await fetch(`https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,webViewLink)`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  if (searchRes.ok) {
    const data = await searchRes.json();
    if (data.files && data.files.length > 0) {
      const existing = data.files[0];
      return {
        spreadsheetId: existing.id,
        spreadsheetUrl: existing.webViewLink || `https://docs.google.com/spreadsheets/d/${existing.id}`
      };
    }
  }

  // Create new Spreadsheet with dedicated sheets
  const createSheetRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      properties: {
        title: 'SoleTrack Footwear Inventory & Sales'
      },
      sheets: [
        { properties: { title: 'Products', gridProperties: { frozenRowCount: 1 } } },
        { properties: { title: 'Colorways_Stock', gridProperties: { frozenRowCount: 1 } } },
        { properties: { title: 'Sales_Orders', gridProperties: { frozenRowCount: 1 } } },
        { properties: { title: 'Purchase_Orders', gridProperties: { frozenRowCount: 1 } } },
        { properties: { title: 'App_Sync_Backup', gridProperties: { frozenRowCount: 1 } } }
      ]
    })
  });

  if (!createSheetRes.ok) {
    throw new Error(`Failed to create Google Spreadsheet: ${createSheetRes.statusText}`);
  }

  const sheetData = await createSheetRes.json();
  const spreadsheetId = sheetData.spreadsheetId;

  // Move the spreadsheet into the SoleTrack folder in Drive
  try {
    await fetch(`https://www.googleapis.com/drive/v3/files/${spreadsheetId}?addParents=${folderId}&fields=id,parents`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${accessToken}` }
    });
  } catch (err) {
    console.warn('Could not move sheet into folder:', err);
  }

  // Populate headers
  await initializeSheetHeaders(spreadsheetId, accessToken);

  return {
    spreadsheetId,
    spreadsheetUrl: sheetData.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}`
  };
}

/**
 * Initialize headers with formatting
 */
async function initializeSheetHeaders(spreadsheetId: string, accessToken: string) {
  const headers = [
    {
      range: 'Products!A1:K1',
      values: [[
        'Product ID',
        'Shoe Name',
        'SKU',
        'Gender',
        'Category',
        'Cost Price ($)',
        'Retail Price ($)',
        'Total In-Stock Pairs',
        'Primary Photo URL',
        'Colorways Summary',
        'Created At'
      ]]
    },
    {
      range: 'Colorways_Stock!A1:N1',
      values: [[
        'Product ID',
        'Shoe Name',
        'SKU',
        'Color Name',
        'Photo URL (Drive)',
        'Size 36',
        'Size 37',
        'Size 38',
        'Size 39',
        'Size 40',
        'Size 41',
        'Size 42',
        'Size 43',
        'Size 44'
      ]]
    },
    {
      range: 'Sales_Orders!A1:O1',
      values: [[
        'Order ID',
        'Order #',
        'Platform',
        'Date & Time',
        'Customer Name',
        'Customer Phone',
        'Sender Phone',
        'Location',
        'Delivery Address',
        'Items Detail',
        'Total Pairs',
        'Total Amount ($)',
        'Payment Method',
        'Payment Status',
        'Delivery Status'
      ]]
    },
    {
      range: 'Purchase_Orders!A1:I1',
      values: [[
        'PO ID',
        'PO #',
        'Supplier Name',
        'Created Date',
        'Expected Delivery',
        'Status',
        'Total Pairs',
        'Total Cost ($)',
        'Notes'
      ]]
    },
    {
      range: 'App_Sync_Backup!A1:B1',
      values: [[
        'Last Synced Timestamp',
        'Full JSON Data Backup'
      ]]
    }
  ];

  await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      valueInputOption: 'USER_ENTERED',
      data: headers
    })
  });
}

/**
 * Save all products, colorway stock matrices, sales, and POs to Google Sheets
 */
export async function syncAllDataToGoogleSheets(
  spreadsheetId: string,
  products: ShoeProduct[],
  orders: SaleOrder[],
  purchaseOrders: PurchaseOrder[],
  accessToken: string
): Promise<void> {
  // 1. Prepare Products rows
  const productRows: any[][] = [
    [
      'Product ID',
      'Shoe Name',
      'SKU',
      'Gender',
      'Category',
      'Cost Price ($)',
      'Retail Price ($)',
      'Total In-Stock Pairs',
      'Primary Photo URL',
      'Colorways Summary',
      'Created At'
    ]
  ];

  const colorwayRows: any[][] = [
    [
      'Product ID',
      'Shoe Name',
      'SKU',
      'Color Name',
      'Photo URL (Drive)',
      'Size 36',
      'Size 37',
      'Size 38',
      'Size 39',
      'Size 40',
      'Size 41',
      'Size 42',
      'Size 43',
      'Size 44'
    ]
  ];

  products.forEach(p => {
    // Unique color names
    const colorNames = Array.from(new Set(p.variants.map(v => v.color)));
    const colorSummary = colorNames.join(', ');

    productRows.push([
      p.id,
      p.name,
      p.sku,
      p.gender,
      p.category,
      p.costPrice,
      p.retailPrice,
      p.totalStock,
      p.images[0] || '',
      colorSummary,
      p.createdAt
    ]);

    // Colorway breakdown
    colorNames.forEach(cName => {
      const colorVariants = p.variants.filter(v => v.color === cName);
      const getStockForSize = (sz: number) => {
        const v = colorVariants.find(item => item.size === sz);
        return v ? v.stock : 0;
      };

      const colorImg = p.colorImages?.[cName] || p.images[0] || '';

      colorwayRows.push([
        p.id,
        p.name,
        p.sku,
        cName,
        colorImg,
        getStockForSize(36),
        getStockForSize(37),
        getStockForSize(38),
        getStockForSize(39),
        getStockForSize(40),
        getStockForSize(41),
        getStockForSize(42),
        getStockForSize(43),
        getStockForSize(44)
      ]);
    });
  });

  // 2. Prepare Sales Orders rows
  const orderRows: any[][] = [
    [
      'Order ID',
      'Order #',
      'Platform',
      'Date & Time',
      'Customer Name',
      'Customer Phone',
      'Sender Phone',
      'Location',
      'Delivery Address',
      'Items Detail',
      'Total Pairs',
      'Total Amount ($)',
      'Payment Method',
      'Payment Status',
      'Delivery Status'
    ]
  ];

  orders.forEach(o => {
    const itemsDesc = o.items && o.items.length > 0
      ? o.items.map(i => `${i.productName} (Size ${i.size}, ${i.color} x${i.quantity})`).join('; ')
      : `${o.productName} (Size ${o.size}, ${o.color} x${o.quantity})`;

    orderRows.push([
      o.id,
      o.orderNumber,
      o.orderPlatform || 'Page',
      o.createdAt,
      o.customerName,
      o.customerPhone,
      o.ownerPhone || '',
      o.locationType === 'Phnom Penh' ? `Phnom Penh (${o.district || ''})` : `Province (${o.provinceName || ''})`,
      o.deliveryAddress,
      itemsDesc,
      o.quantity,
      o.totalAmount,
      o.paymentMethod,
      o.paymentStatus,
      o.orderStatus
    ]);
  });

  // 3. Prepare Purchase Orders rows
  const poRows: any[][] = [
    [
      'PO ID',
      'PO #',
      'Supplier Name',
      'Created Date',
      'Expected Delivery',
      'Status',
      'Total Pairs',
      'Total Cost ($)',
      'Notes'
    ]
  ];

  purchaseOrders.forEach(po => {
    const totalPairs = po.items.reduce((s, i) => s + i.reorderQty, 0);
    poRows.push([
      po.id,
      po.poNumber,
      po.supplierName,
      po.createdAt,
      po.expectedDelivery,
      po.status,
      totalPairs,
      po.totalAmount,
      po.notes || ''
    ]);
  });

  // 4. Prepare Backup JSON Row
  const backupJson = JSON.stringify({
    products,
    orders,
    purchaseOrders
  });

  const backupRows: any[][] = [
    ['Last Synced Timestamp', 'Full JSON Data Backup'],
    [new Date().toISOString(), backupJson]
  ];

  // Clear existing ranges then write updated rows
  const sheetsToClear = ['Products', 'Colorways_Stock', 'Sales_Orders', 'Purchase_Orders', 'App_Sync_Backup'];
  for (const sName of sheetsToClear) {
    try {
      await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(sName)}!A1:Z500:clear`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` }
      });
    } catch (e) {
      console.warn(`Could not clear sheet ${sName}:`, e);
    }
  }

  // Write new data batch
  const writeRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      valueInputOption: 'USER_ENTERED',
      data: [
        { range: 'Products!A1', values: productRows },
        { range: 'Colorways_Stock!A1', values: colorwayRows },
        { range: 'Sales_Orders!A1', values: orderRows },
        { range: 'Purchase_Orders!A1', values: poRows },
        { range: 'App_Sync_Backup!A1', values: backupRows }
      ]
    })
  });

  if (!writeRes.ok) {
    const errText = await writeRes.text();
    console.error('Failed to sync to sheets:', errText);
    throw new Error(`Google Sheets sync error: ${writeRes.statusText}`);
  }
}

/**
 * Load all products, orders, and POs from Google Sheets (Backup tab or structured data)
 */
export async function loadAllDataFromGoogleSheets(
  spreadsheetId: string,
  accessToken: string
): Promise<LoadedSyncData | null> {
  try {
    // Read the App_Sync_Backup tab first
    const backupRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/App_Sync_Backup!B2`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    if (backupRes.ok) {
      const data = await backupRes.json();
      const rawJson = data.values?.[0]?.[0];
      if (rawJson && typeof rawJson === 'string') {
        const parsed = JSON.parse(rawJson);
        if (parsed.products && Array.isArray(parsed.products)) {
          return {
            products: parsed.products || [],
            orders: parsed.orders || [],
            purchaseOrders: parsed.purchaseOrders || []
          };
        }
      }
    }
  } catch (e) {
    console.warn('Could not read from App_Sync_Backup JSON cell:', e);
  }

  return null;
}
