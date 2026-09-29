import { ShoeProduct, SaleOrder, PurchaseOrder } from '../types';

export interface CloudflareConfig {
  accountId: string;
  apiToken: string;
  d1DatabaseId: string;
  r2BucketName: string;
  r2PublicDomain?: string;
  autoSyncEnabled: boolean;
}

const CONFIG_STORAGE_KEY = 'soletrack_cloudflare_config_v1';

export const DEFAULT_CLOUDFLARE_CONFIG: CloudflareConfig = {
  accountId: '',
  apiToken: '',
  d1DatabaseId: '',
  r2BucketName: '',
  r2PublicDomain: '',
  autoSyncEnabled: true
};

export function getLocalCloudflareConfig(): CloudflareConfig {
  try {
    const saved = localStorage.getItem(CONFIG_STORAGE_KEY);
    if (saved) {
      return { ...DEFAULT_CLOUDFLARE_CONFIG, ...JSON.parse(saved) };
    }
  } catch (e) {
    console.error('Failed reading local Cloudflare config:', e);
  }
  return DEFAULT_CLOUDFLARE_CONFIG;
}

export function saveLocalCloudflareConfig(config: Partial<CloudflareConfig>): CloudflareConfig {
  const current = getLocalCloudflareConfig();
  const updated = { ...current, ...config };
  localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(updated));
  return updated;
}

export async function fetchCloudflareStatus(config?: CloudflareConfig) {
  try {
    const res = await fetch('/api/cloudflare/status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config || getLocalCloudflareConfig())
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err: any) {
    return {
      d1Connected: false,
      r2Connected: false,
      message: err.message || 'Server connection failed'
    };
  }
}

export async function initCloudflareD1Schema(config?: CloudflareConfig) {
  try {
    const res = await fetch('/api/cloudflare/init-schema', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config || getLocalCloudflareConfig())
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, message: err.message || 'Schema initialization failed' };
  }
}

export async function pushDataToCloudflare(
  products: ShoeProduct[],
  orders: SaleOrder[],
  purchaseOrders: PurchaseOrder[],
  config?: CloudflareConfig
) {
  try {
    const res = await fetch('/api/cloudflare/sync/push', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        config: config || getLocalCloudflareConfig(),
        products,
        orders,
        purchaseOrders
      })
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, message: err.message || 'Cloudflare Push failed' };
  }
}

export async function pullDataFromCloudflare(config?: CloudflareConfig) {
  try {
    const res = await fetch('/api/cloudflare/sync/pull', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        config: config || getLocalCloudflareConfig()
      })
    });
    if (!res.ok) return null;
    const json = await res.json();
    if (json.success && json.data) {
      return json.data as {
        products: ShoeProduct[];
        orders: SaleOrder[];
        purchaseOrders: PurchaseOrder[];
      };
    }
    return null;
  } catch (err: any) {
    console.error('Cloudflare Pull Error:', err);
    return null;
  }
}

export async function uploadImageToCloudflareR2(
  base64Data: string,
  filename: string,
  config?: CloudflareConfig
): Promise<{ url: string; success: boolean }> {
  try {
    const res = await fetch('/api/cloudflare/upload-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        config: config || getLocalCloudflareConfig(),
        base64Data,
        filename
      })
    });
    const json = await res.json();
    if (json.success && json.url) {
      return { url: json.url, success: true };
    }
    return { url: base64Data, success: false };
  } catch (err: any) {
    console.error('R2 Upload Error:', err);
    return { url: base64Data, success: false };
  }
}
