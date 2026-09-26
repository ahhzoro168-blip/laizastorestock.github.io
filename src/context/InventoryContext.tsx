import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  ShoeProduct, 
  SaleOrder, 
  PurchaseOrder, 
  ShoeColor, 
  ShoeGender, 
  OrderStatus, 
  POStatus, 
  PurchaseOrderItem, 
  TrackingStep, 
  LocationType,
  CartItem,
  SaleOrderItem,
  RecordMultiSaleInput
} from '../types';
import {
  subscribeToProducts,
  subscribeToOrders,
  subscribeToPurchaseOrders,
  subscribeToStoreSettings,
  saveProductToFirestore,
  deleteProductFromFirestore,
  saveOrderToFirestore,
  savePOToFirestore,
  saveStoreSettingsToFirestore,
  seedLocalItemsToFirestore
} from '../services/firebaseDb';
import { 
  INITIAL_PRODUCTS, 
  INITIAL_ORDERS, 
  INITIAL_PURCHASE_ORDERS,
  MEN_SIZES,
  WOMEN_SIZES,
  ALL_COLORS
} from '../data/mockData';

export interface LowStockAlertItem {
  productId: string;
  productName: string;
  productImage: string;
  sku: string;
  size: number;
  color: ShoeColor;
  currentStock: number;
  minThreshold: number;
  costPrice: number;
  retailPrice: number;
  salesCount: number;
}

interface RecordSaleInput {
  productId: string;
  size: number;
  color: ShoeColor;
  quantity: number;
  customerName: string;
  customerPhone: string;
  ownerPhone?: string;
  locationType: LocationType;
  provinceName?: string;
  district?: string;
  deliveryAddress: string;
  paymentMethod: string;
  paymentStatus: 'Paid' | 'Pending' | 'COD - Due on Arrival';
  notes?: string;
}

interface InventoryContextType {
  products: ShoeProduct[];
  orders: SaleOrder[];
  purchaseOrders: PurchaseOrder[];
  lowStockItems: LowStockAlertItem[];
  cart: CartItem[];
  totalInventoryCount: number;
  totalRevenue: number;
  totalProfit: number;
  totalSoldUnits: number;
  totalCartItems: number;
  totalCartAmount: number;
  totalCartCost: number;
  totalCartProfit: number;
  addToCart: (product: ShoeProduct, size: number, color: ShoeColor, quantity?: number) => { success: boolean; message?: string };
  removeFromCart: (cartItemId: string) => void;
  updateCartQuantity: (cartItemId: string, newQuantity: number) => void;
  clearCart: () => void;
  recordSale: (saleInput: RecordSaleInput) => SaleOrder | null;
  recordMultiSale: (saleInput: RecordMultiSaleInput) => SaleOrder | null;
  addProduct: (newProduct: Omit<ShoeProduct, 'id' | 'createdAt' | 'totalStock' | 'popularScore'> & { initialBulkStock?: number }) => ShoeProduct;
  updateProduct: (product: ShoeProduct) => void;
  deleteProduct: (id: string) => void;
  updateVariantStock: (productId: string, size: number, color: ShoeColor, newStock: number) => void;
  generateAutomatedPO: (supplierName?: string) => PurchaseOrder | null;
  updatePOStatus: (poId: string, status: POStatus) => void;
  updateOrderStatus: (orderId: string, newStatus: OrderStatus, note?: string, location?: string, courierName?: string, courierPhone?: string) => void;
  categories: string[];
  modelSkus: string[];
  addCategory: (categoryName: string) => void;
  updateCategory: (oldName: string, newName: string) => void;
  deleteCategory: (categoryName: string) => void;
  addModelSku: (skuCode: string) => void;
  updateModelSku: (oldSku: string, newSku: string) => void;
  deleteModelSku: (skuCode: string) => void;
  clearOldDefaults: () => void;
  resetDemoData: () => void;
  clearAllData: () => void;
  restoreAllData: (data: { products?: ShoeProduct[]; orders?: SaleOrder[]; purchaseOrders?: PurchaseOrder[] }) => void;
  syncAllLocalToCloud: () => Promise<void>;
  isCloudConnected: boolean;
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

const STORAGE_KEY_PRODUCTS = 'soletrack_products_v2';
const STORAGE_KEY_ORDERS = 'soletrack_orders_v2';
const STORAGE_KEY_PO = 'soletrack_po_v2';
const STORAGE_KEY_CART = 'soletrack_cart_v2';
const STORAGE_KEY_CATEGORIES = 'soletrack_categories_v2';
const STORAGE_KEY_SKUS = 'soletrack_skus_v2';
const STORAGE_KEY_DELETED_PRODUCT_IDS = 'soletrack_deleted_product_ids_v2';

const getDeletedProductIds = (): Set<string> => {
  if (typeof window === 'undefined') return new Set();
  try {
    const saved = localStorage.getItem(STORAGE_KEY_DELETED_PRODUCT_IDS);
    if (saved) {
      return new Set(JSON.parse(saved));
    }
  } catch (e) {
    console.error(e);
  }
  return new Set();
};

const markProductAsDeleted = (id: string) => {
  if (typeof window === 'undefined') return;
  try {
    const current = getDeletedProductIds();
    current.add(id);
    localStorage.setItem(STORAGE_KEY_DELETED_PRODUCT_IDS, JSON.stringify(Array.from(current)));
  } catch (e) {
    console.error(e);
  }
};

// Purge obsolete demo keys from browser storage once
if (typeof window !== 'undefined') {
  try {
    localStorage.removeItem('soletrack_products_v1');
    localStorage.removeItem('soletrack_orders_v1');
    localStorage.removeItem('soletrack_po_v1');
  } catch (e) {
    // ignore
  }
}

export const InventoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_CART);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return [];
  });

  const [products, setProducts] = useState<ShoeProduct[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_PRODUCTS);
    if (saved) {
      try { 
        const parsed: ShoeProduct[] = JSON.parse(saved); 
        return parsed.map(p => ({
          ...p,
          totalStock: p.variants.reduce((sum, v) => sum + v.stock, 0)
        }));
      } catch (e) { 
        console.error(e); 
      }
    }
    return [];
  });

  const [orders, setOrders] = useState<SaleOrder[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_ORDERS);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return [];
  });

  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_PO);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return [];
  });

  const [isCloudConnected, setIsCloudConnected] = useState<boolean>(true);

  const DEFAULT_SKUS = [
    'SHOE-01',
    'SHOE-02',
    'SHOE-03',
    'SHOE-04',
    'SHOE-05',
    'SHOE-06',
    'SHOE-07',
    'SHOE-08'
  ];

  const DEFAULT_CATEGORIES = [
    'ស្បែកជើងសកល',
    'ស្បែកជើងធំពោ',
    'ស្បែកជើងហាម',
    'ស្បែកជើងក្រវ៉ាត់',
    'ស្បែកជើងកែង',
    'ស្បែកជើង Cross'
  ];

  // Managed Categories & Model SKUs State
  const [customCategories, setCustomCategories] = useState<string[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_CATEGORIES);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        console.error(e);
      }
    }
    return DEFAULT_CATEGORIES;
  });

  const [customSkus, setCustomSkus] = useState<string[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_SKUS);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        console.error(e);
      }
    }
    return DEFAULT_SKUS;
  });

  // Derived merged lists (custom + current products)
  const categories = Array.from(new Set([
    ...customCategories,
    ...products.map(p => p.category).filter(Boolean)
  ]));

  const modelSkus = Array.from(new Set([
    ...customSkus,
    ...products.map(p => p.sku).filter(Boolean)
  ]));

  const addCategory = (categoryName: string) => {
    const trimmed = categoryName.trim();
    if (!trimmed) return;
    setCustomCategories(prev => {
      if (prev.includes(trimmed)) return prev;
      const updated = [...prev, trimmed];
      localStorage.setItem(STORAGE_KEY_CATEGORIES, JSON.stringify(updated));
      saveStoreSettingsToFirestore({ customCategories: updated, customSkus });
      return updated;
    });
  };

  const updateCategory = (oldName: string, newName: string) => {
    const trimmedNew = newName.trim();
    if (!trimmedNew || oldName === trimmedNew) return;
    setCustomCategories(prev => {
      const updated = prev.map(c => c === oldName ? trimmedNew : c);
      localStorage.setItem(STORAGE_KEY_CATEGORIES, JSON.stringify(updated));
      saveStoreSettingsToFirestore({ customCategories: updated, customSkus });
      return updated;
    });
    setProducts(prev => prev.map(p => p.category === oldName ? { ...p, category: trimmedNew } : p));
  };

  const deleteCategory = (categoryName: string) => {
    setCustomCategories(prev => {
      const updated = prev.filter(c => c !== categoryName);
      localStorage.setItem(STORAGE_KEY_CATEGORIES, JSON.stringify(updated));
      saveStoreSettingsToFirestore({ customCategories: updated, customSkus });
      return updated;
    });
    setProducts(prev => {
      const remaining = customCategories.filter(c => c !== categoryName);
      const fallback = remaining[0] || 'General';
      return prev.map(p => p.category === categoryName ? { ...p, category: fallback } : p);
    });
  };

  const addModelSku = (skuCode: string) => {
    const trimmed = skuCode.trim().toUpperCase();
    if (!trimmed) return;
    setCustomSkus(prev => {
      if (prev.includes(trimmed)) return prev;
      const updated = [...prev, trimmed];
      localStorage.setItem(STORAGE_KEY_SKUS, JSON.stringify(updated));
      saveStoreSettingsToFirestore({ customCategories, customSkus: updated });
      return updated;
    });
  };

  const updateModelSku = (oldSku: string, newSku: string) => {
    const trimmedNew = newSku.trim().toUpperCase();
    if (!trimmedNew || oldSku === trimmedNew) return;
    setCustomSkus(prev => {
      const updated = prev.map(s => s === oldSku ? trimmedNew : s);
      localStorage.setItem(STORAGE_KEY_SKUS, JSON.stringify(updated));
      saveStoreSettingsToFirestore({ customCategories, customSkus: updated });
      return updated;
    });
    setProducts(prev => prev.map(p => p.sku === oldSku ? { ...p, sku: trimmedNew } : p));
  };

  const deleteModelSku = (skuCode: string) => {
    setCustomSkus(prev => {
      const updated = prev.filter(s => s !== skuCode);
      localStorage.setItem(STORAGE_KEY_SKUS, JSON.stringify(updated));
      saveStoreSettingsToFirestore({ customCategories, customSkus: updated });
      return updated;
    });
    setProducts(prev => prev.map(p => p.sku === skuCode ? { ...p, sku: '' } : p));
  };

  const clearOldDefaults = () => {
    setCustomCategories([]);
    setCustomSkus([]);
    localStorage.removeItem(STORAGE_KEY_CATEGORIES);
    localStorage.removeItem(STORAGE_KEY_SKUS);
    // Remove sample default products matching old sample SKUs if any exist
    setProducts(prev => prev.filter(p => !p.sku.startsWith('SHOE-') && !p.sku.startsWith('ST-DEMO')));
  };

  // Real-time synchronization across devices (PC, Phone, iPad, and GitHub site)
  useEffect(() => {
    let initialCloudProductsLoaded = false;
    let initialCloudOrdersLoaded = false;
    let initialCloudPOsLoaded = false;

    const unsubProducts = subscribeToProducts(
      (cloudProducts) => {
        setIsCloudConnected(true);

        const deletedIds = getDeletedProductIds();

        // Read local storage to preserve any items created locally that haven't synchronized to Firestore yet
        let localProducts: ShoeProduct[] = [];
        const localSaved = localStorage.getItem(STORAGE_KEY_PRODUCTS);
        if (localSaved) {
          try {
            localProducts = JSON.parse(localSaved);
          } catch (e) {
            console.error(e);
          }
        }

        // Filter out any explicitly deleted products from cloud response
        const validCloudProducts = cloudProducts.filter(p => !deletedIds.has(p.id));

        const cloudMap = new Map(validCloudProducts.map(p => [p.id, p]));

        // Find local items that are NOT in cloud yet AND NOT deleted
        const pendingLocalItems = localProducts.filter(p => !cloudMap.has(p.id) && !deletedIds.has(p.id));

        if (pendingLocalItems.length > 0) {
          // Re-sync missing local items to Firestore automatically so they never get lost
          pendingLocalItems.forEach(item => {
            saveProductToFirestore(item).catch(err => console.error('Failed re-syncing local product to Firestore:', err));
          });
        }

        // Merge cloud products with pending local items
        const mergedProducts = [
          ...validCloudProducts.map(p => ({
            ...p,
            totalStock: p.variants.reduce((sum, v) => sum + v.stock, 0)
          })),
          ...pendingLocalItems
        ];

        setProducts(mergedProducts);
        localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(mergedProducts));
        initialCloudProductsLoaded = true;
      },
      (err) => {
        console.warn('Realtime products listener error:', err);
      }
    );

    const unsubOrders = subscribeToOrders(
      (cloudOrders) => {
        let localOrders: SaleOrder[] = [];
        const localSaved = localStorage.getItem(STORAGE_KEY_ORDERS);
        if (localSaved) {
          try {
            localOrders = JSON.parse(localSaved);
          } catch (e) {
            console.error(e);
          }
        }

        const cloudMap = new Map(cloudOrders.map(o => [o.id, o]));
        const pendingLocal = localOrders.filter(o => !cloudMap.has(o.id));

        if (pendingLocal.length > 0) {
          pendingLocal.forEach(o => {
            saveOrderToFirestore(o).catch(e => console.error('Failed re-syncing order to Firestore:', e));
          });
        }

        const merged = [...cloudOrders, ...pendingLocal];
        if (merged.length > 0) {
          setOrders(merged);
          localStorage.setItem(STORAGE_KEY_ORDERS, JSON.stringify(merged));
        }
        initialCloudOrdersLoaded = true;
      }
    );

    const unsubPOs = subscribeToPurchaseOrders(
      (cloudPOs) => {
        let localPOs: PurchaseOrder[] = [];
        const localSaved = localStorage.getItem(STORAGE_KEY_PO);
        if (localSaved) {
          try {
            localPOs = JSON.parse(localSaved);
          } catch (e) {
            console.error(e);
          }
        }

        const cloudMap = new Map(cloudPOs.map(po => [po.id, po]));
        const pendingLocal = localPOs.filter(po => !cloudMap.has(po.id));

        if (pendingLocal.length > 0) {
          pendingLocal.forEach(po => {
            savePOToFirestore(po).catch(e => console.error('Failed re-syncing PO to Firestore:', e));
          });
        }

        const merged = [...cloudPOs, ...pendingLocal];
        if (merged.length > 0) {
          setPurchaseOrders(merged);
          localStorage.setItem(STORAGE_KEY_PO, JSON.stringify(merged));
        }
        initialCloudPOsLoaded = true;
      }
    );

    const unsubStoreSettings = subscribeToStoreSettings((config) => {
      if (config.customCategories && config.customCategories.length > 0) {
        setCustomCategories(config.customCategories);
        localStorage.setItem(STORAGE_KEY_CATEGORIES, JSON.stringify(config.customCategories));
      } else {
        saveStoreSettingsToFirestore({ customCategories: DEFAULT_CATEGORIES, customSkus: DEFAULT_SKUS });
      }
      if (config.customSkus && config.customSkus.length > 0) {
        setCustomSkus(config.customSkus);
        localStorage.setItem(STORAGE_KEY_SKUS, JSON.stringify(config.customSkus));
      } else {
        saveStoreSettingsToFirestore({ customCategories: DEFAULT_CATEGORIES, customSkus: DEFAULT_SKUS });
      }
    });

    return () => {
      unsubProducts();
      unsubOrders();
      unsubPOs();
      unsubStoreSettings();
    };
  }, []);

  // Save to localStorage on change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_ORDERS, JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_PO, JSON.stringify(purchaseOrders));
  }, [purchaseOrders]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_CART, JSON.stringify(cart));
  }, [cart]);

  // Derive low stock items across all variants
  const lowStockItems: LowStockAlertItem[] = React.useMemo(() => {
    const alerts: LowStockAlertItem[] = [];
    products.forEach(p => {
      p.variants.forEach(v => {
        if (v.stock <= v.minThreshold) {
          alerts.push({
            productId: p.id,
            productName: p.name,
            productImage: p.images[0] || '',
            sku: v.sku,
            size: v.size,
            color: v.color,
            currentStock: v.stock,
            minThreshold: v.minThreshold,
            costPrice: p.costPrice,
            retailPrice: p.retailPrice,
            salesCount: v.salesCount
          });
        }
      });
    });
    return alerts;
  }, [products]);

  // Overall statistics
  const totalInventoryCount = React.useMemo(() => {
    return products.reduce((sum, p) => sum + p.totalStock, 0);
  }, [products]);

  const totalRevenue = React.useMemo(() => {
    return orders.reduce((sum, o) => sum + o.totalAmount, 0);
  }, [orders]);

  const totalProfit = React.useMemo(() => {
    return orders.reduce((sum, o) => sum + o.profit, 0);
  }, [orders]);

  const totalSoldUnits = React.useMemo(() => {
    return orders.reduce((sum, o) => sum + o.quantity, 0);
  }, [orders]);

  // Cart calculations
  const totalCartItems = React.useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);

  const totalCartAmount = React.useMemo(() => {
    return cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  }, [cart]);

  const totalCartCost = React.useMemo(() => {
    return cart.reduce((sum, item) => sum + item.costPrice * item.quantity, 0);
  }, [cart]);

  const totalCartProfit = React.useMemo(() => {
    return totalCartAmount - totalCartCost;
  }, [totalCartAmount, totalCartCost]);

  // Cart methods
  const addToCart = (
    product: ShoeProduct, 
    size: number, 
    color: ShoeColor, 
    quantity: number = 1
  ): { success: boolean; message?: string } => {
    const variant = product.variants.find(v => v.size === size && v.color === color);
    if (!variant) {
      return { success: false, message: 'Selected variant is not available.' };
    }

    if (variant.stock <= 0) {
      return { success: false, message: `Size ${size} (${color}) is currently out of stock.` };
    }

    const cartItemId = `${product.id}-${size}-${color}`;
    const existingIndex = cart.findIndex(item => item.id === cartItemId);
    const existingQty = existingIndex > -1 ? cart[existingIndex].quantity : 0;
    const requestedTotalQty = existingQty + quantity;

    if (requestedTotalQty > variant.stock) {
      return {
        success: false,
        message: `Only ${variant.stock} pairs available in Size ${size} (${color}). You already have ${existingQty} in your cart.`
      };
    }

    const productImage = (product.colorImages && product.colorImages[color]) || product.images[0] || '';

    if (existingIndex > -1) {
      setCart(prev => prev.map((item, idx) => {
        if (idx === existingIndex) {
          return {
            ...item,
            quantity: requestedTotalQty,
            stock: variant.stock
          };
        }
        return item;
      }));
    } else {
      const newItem: CartItem = {
        id: cartItemId,
        productId: product.id,
        productName: product.name,
        sku: variant.sku || product.sku,
        productImage,
        gender: product.gender,
        category: product.category,
        size,
        color,
        quantity,
        unitPrice: product.retailPrice,
        costPrice: product.costPrice,
        stock: variant.stock
      };
      setCart(prev => [...prev, newItem]);
    }

    return { success: true };
  };

  const removeFromCart = (cartItemId: string) => {
    setCart(prev => prev.filter(item => item.id !== cartItemId));
  };

  const updateCartQuantity = (cartItemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(cartItemId);
      return;
    }
    setCart(prev => prev.map(item => {
      if (item.id === cartItemId) {
        const targetQty = Math.min(newQuantity, item.stock);
        return { ...item, quantity: targetQty };
      }
      return item;
    }));
  };

  const clearCart = () => {
    setCart([]);
    localStorage.removeItem(STORAGE_KEY_CART);
  };

  // Multi-item Cart Sale
  const recordMultiSale = (input: RecordMultiSaleInput): SaleOrder | null => {
    if (!input.items || input.items.length === 0) return null;

    // Verify stock availability
    for (const item of input.items) {
      const prod = products.find(p => p.id === item.productId);
      if (!prod) {
        alert(`Product "${item.productName}" not found in inventory.`);
        return null;
      }
      const variant = prod.variants.find(v => v.size === item.size && v.color === item.color);
      if (!variant || variant.stock < item.quantity) {
        alert(`Insufficient stock for ${item.productName} (Size ${item.size}, ${item.color}). Only ${variant?.stock ?? 0} available.`);
        return null;
      }
    }

    // Deduct stock for all items and update salesCount
    setProducts(prevProducts => {
      return prevProducts.map(prod => {
        const cartMatches = input.items.filter(item => item.productId === prod.id);
        if (cartMatches.length === 0) return prod;

        const updatedVariants = prod.variants.map(variant => {
          const match = cartMatches.find(item => item.size === variant.size && item.color === variant.color);
          if (match) {
            return {
              ...variant,
              stock: Math.max(0, variant.stock - match.quantity),
              salesCount: (variant.salesCount || 0) + match.quantity
            };
          }
          return variant;
        });

        const newTotalStock = updatedVariants.reduce((sum, v) => sum + v.stock, 0);

        return {
          ...prod,
          variants: updatedVariants,
          totalStock: newTotalStock
        };
      });
    });

    // Itemized sale order items
    const saleOrderItems: SaleOrderItem[] = input.items.map(item => {
      const lineTotal = item.unitPrice * item.quantity;
      const costTotal = item.costPrice * item.quantity;
      return {
        productId: item.productId,
        productName: item.productName,
        sku: item.sku,
        productImage: item.productImage,
        gender: item.gender,
        category: item.category,
        size: item.size,
        color: item.color,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        costPrice: item.costPrice,
        totalAmount: lineTotal,
        profit: lineTotal - costTotal
      };
    });

    const totalQty = saleOrderItems.reduce((sum, item) => sum + item.quantity, 0);
    const grandTotal = saleOrderItems.reduce((sum, item) => sum + item.totalAmount, 0);
    const totalCost = saleOrderItems.reduce((sum, item) => sum + (item.costPrice * item.quantity), 0);
    const totalProfit = grandTotal - totalCost;

    const firstItem = saleOrderItems[0];
    const orderNum = `ST-${Math.floor(1000 + Math.random() * 9000)}`;

    const initialTracking: TrackingStep[] = [
      {
        status: 'Confirmed',
        timestamp: new Date().toISOString(),
        location: input.locationType === 'Phnom Penh' ? 'Phnom Penh Central Store' : 'Provincial Dispatch Hub',
        note: `Order ${orderNum} confirmed (${totalQty} pairs across ${saleOrderItems.length} product${saleOrderItems.length > 1 ? 's' : ''}) via ${input.paymentMethod}`
      }
    ];

    const newOrder: SaleOrder = {
      id: `ord-${Date.now()}`,
      orderNumber: orderNum,
      productId: firstItem.productId,
      productName: saleOrderItems.length === 1 
        ? firstItem.productName 
        : `${firstItem.productName} + ${saleOrderItems.length - 1} more item${saleOrderItems.length > 2 ? 's' : ''}`,
      productImage: firstItem.productImage,
      gender: firstItem.gender,
      category: firstItem.category,
      size: firstItem.size,
      color: firstItem.color,
      quantity: totalQty,
      unitPrice: firstItem.unitPrice,
      totalAmount: grandTotal,
      costPrice: totalCost,
      profit: totalProfit,
      items: saleOrderItems,
      itemCount: saleOrderItems.length,
      orderPlatform: input.orderPlatform || 'Page',
      locationType: input.locationType,
      provinceName: input.provinceName,
      district: input.district,
      deliveryAddress: input.deliveryAddress,
      customerName: input.customerName,
      customerPhone: input.customerPhone,
      ownerPhone: input.ownerPhone,
      paymentMethod: input.paymentMethod,
      paymentStatus: input.paymentStatus,
      orderStatus: 'Confirmed',
      trackingHistory: initialTracking,
      createdAt: new Date().toISOString(),
      notes: input.notes
    };

    setOrders(prev => [newOrder, ...prev]);
    saveOrderToFirestore(newOrder).catch(e => console.error('Cloud order save error:', e));

    // Also persist updated product stocks to Firestore
    setProducts(currentProducts => {
      currentProducts.forEach(prod => {
        if (input.items.some(item => item.productId === prod.id)) {
          saveProductToFirestore(prod).catch(e => console.error('Cloud stock update error:', e));
        }
      });
      return currentProducts;
    });

    clearCart();
    return newOrder;
  };

  // 1. Record Sale and deduct stock
  const recordSale = (input: RecordSaleInput): SaleOrder | null => {
    const product = products.find(p => p.id === input.productId);
    if (!product) return null;

    const variantIndex = product.variants.findIndex(
      v => v.size === input.size && v.color === input.color
    );

    if (variantIndex === -1) return null;
    const variant = product.variants[variantIndex];

    if (variant.stock < input.quantity) {
      alert(`Insufficient stock! Only ${variant.stock} pairs available in Size ${input.size} (${input.color}).`);
      return null;
    }

    // Deduct stock and increment salesCount
    const updatedVariants = [...product.variants];
    updatedVariants[variantIndex] = {
      ...variant,
      stock: variant.stock - input.quantity,
      salesCount: (variant.salesCount || 0) + input.quantity
    };

    const newTotalStock = updatedVariants.reduce((sum, v) => sum + v.stock, 0);

    setProducts(prev => prev.map(p => {
      if (p.id === input.productId) {
        return {
          ...p,
          variants: updatedVariants,
          totalStock: newTotalStock
        };
      }
      return p;
    }));

    // Create Order Record
    const orderNum = `ST-${Math.floor(1000 + Math.random() * 9000)}`;
    const lineTotal = product.retailPrice * input.quantity;
    const costTotal = product.costPrice * input.quantity;
    const profitTotal = lineTotal - costTotal;

    const initialTracking: TrackingStep[] = [
      {
        status: 'Confirmed',
        timestamp: new Date().toISOString(),
        location: input.locationType === 'Phnom Penh' ? 'Phnom Penh Central Store' : 'Provincial Dispatch Hub',
        note: `Order ${orderNum} confirmed via ${input.paymentMethod}`
      }
    ];

    const newOrder: SaleOrder = {
      id: `ord-${Date.now()}`,
      orderNumber: orderNum,
      productId: product.id,
      productName: product.name,
      productImage: (product.colorImages && product.colorImages[input.color]) || product.images[0] || '',
      gender: product.gender,
      category: product.category,
      size: input.size,
      color: input.color,
      quantity: input.quantity,
      unitPrice: product.retailPrice,
      totalAmount: lineTotal,
      costPrice: product.costPrice,
      profit: profitTotal,
      locationType: input.locationType,
      provinceName: input.provinceName,
      district: input.district,
      deliveryAddress: input.deliveryAddress,
      customerName: input.customerName,
      customerPhone: input.customerPhone,
      ownerPhone: input.ownerPhone,
      paymentMethod: input.paymentMethod,
      paymentStatus: input.paymentStatus,
      orderStatus: 'Confirmed',
      trackingHistory: initialTracking,
      createdAt: new Date().toISOString(),
      notes: input.notes
    };

    setOrders(prev => [newOrder, ...prev]);
    saveOrderToFirestore(newOrder).catch(e => console.error('Cloud order save error:', e));
    saveProductToFirestore({
      ...product,
      variants: updatedVariants,
      totalStock: newTotalStock
    }).catch(e => console.error('Cloud product stock sync error:', e));
    return newOrder;
  };

  // 2. Add New Shoe Product
  const addProduct = (
    newProductData: Omit<ShoeProduct, 'id' | 'createdAt' | 'totalStock' | 'popularScore'> & { initialBulkStock?: number }
  ): ShoeProduct => {
    const id = `prod-${Date.now()}`;
    const initialBulk = newProductData.initialBulkStock ?? 6;

    let targetSizes: number[] = [];
    if (newProductData.gender === 'men') {
      targetSizes = [...MEN_SIZES];
    } else if (newProductData.gender === 'women') {
      targetSizes = [...WOMEN_SIZES];
    } else {
      targetSizes = [36, 37, 38, 39, 40, 41, 42, 43, 44];
    }

    // Build standard color variants (Black, White, Navy, Beige)
    const variants = newProductData.variants?.length > 0 
      ? newProductData.variants 
      : ALL_COLORS.flatMap(color => {
          const colorCode = color.substring(0, 3).toUpperCase();
          return targetSizes.map(size => ({
            sku: `${newProductData.sku || 'ST'}-${colorCode}-${size}`,
            size,
            color,
            stock: initialBulk,
            minThreshold: 4,
            salesCount: 0
          }));
        });

    const totalStock = variants.reduce((sum, v) => sum + v.stock, 0);

    const fullProduct: ShoeProduct = {
      ...newProductData,
      id,
      variants,
      totalStock,
      popularScore: 75,
      createdAt: new Date().toISOString()
    };

    setProducts(prev => {
      const next = [fullProduct, ...prev];
      localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(next));
      return next;
    });
    saveProductToFirestore(fullProduct).catch(e => console.error('Cloud product save error:', e));
    return fullProduct;
  };

  // 3. Update Existing Product
  const updateProduct = (updated: ShoeProduct) => {
    const totalStock = updated.variants.reduce((sum, v) => sum + v.stock, 0);
    const finalProduct = { ...updated, totalStock };
    setProducts(prev => prev.map(p => p.id === updated.id ? finalProduct : p));
    saveProductToFirestore(finalProduct).catch(e => console.error('Cloud product update error:', e));
  };

  // 4. Delete Product
  const deleteProduct = (id: string) => {
    markProductAsDeleted(id);
    setProducts(prev => {
      const next = prev.filter(p => p.id !== id);
      localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(next));
      return next;
    });
    deleteProductFromFirestore(id).catch(e => console.error('Cloud product delete error:', e));
  };

  // 5. Update specific variant stock directly (audit / manual stock in)
  const updateVariantStock = (productId: string, size: number, color: ShoeColor, newStock: number) => {
    setProducts(prev => prev.map(p => {
      if (p.id === productId) {
        const updatedVariants = p.variants.map(v => {
          if (v.size === size && v.color === color) {
            return { ...v, stock: Math.max(0, newStock) };
          }
          return v;
        });
        const totalStock = updatedVariants.reduce((sum, v) => sum + v.stock, 0);
        const updatedP = { ...p, variants: updatedVariants, totalStock };
        saveProductToFirestore(updatedP).catch(e => console.error('Cloud stock update error:', e));
        return updatedP;
      }
      return p;
    }));
  };

  // 6. Automated Purchase Order Generator
  const generateAutomatedPO = (supplierName?: string): PurchaseOrder | null => {
    const poItems: PurchaseOrderItem[] = [];

    products.forEach(p => {
      p.variants.forEach(v => {
        // Condition: stock <= threshold or high velocity
        const isLowStock = v.stock <= v.minThreshold;
        const isHighVelocity = v.salesCount >= 25 && v.stock < 8;

        if (isLowStock || isHighVelocity) {
          const reorderQty = isHighVelocity ? 25 : Math.max(15, (v.minThreshold * 4) - v.stock);
          const lineTotal = reorderQty * p.costPrice;

          poItems.push({
            productId: p.id,
            productName: p.name,
            productSku: v.sku,
            size: v.size,
            color: v.color,
            currentStock: v.stock,
            reorderQty,
            unitCost: p.costPrice,
            totalCost: lineTotal,
            reason: isLowStock ? 'Low Stock Threshold' : 'High Velocity Surge'
          });
        }
      });
    });

    if (poItems.length === 0) {
      if (products.length === 0) {
        alert('Please add products to your footwear catalog before generating a Purchase Order.');
        return null;
      }
      // If none are low, create a seasonal restocking PO for top sellers
      const topSellingProduct = products[0];
      if (topSellingProduct && topSellingProduct.variants.length > 0) {
        const topVariant = topSellingProduct.variants[0];
        poItems.push({
          productId: topSellingProduct.id,
          productName: topSellingProduct.name,
          productSku: topVariant.sku,
          size: topVariant.size,
          color: topVariant.color,
          currentStock: topVariant.stock,
          reorderQty: 20,
          unitCost: topSellingProduct.costPrice,
          totalCost: 20 * topSellingProduct.costPrice,
          reason: 'Seasonal Demand Forecast'
        });
      }
    }

    if (poItems.length === 0) {
      return null;
    }

    const totalAmount = poItems.reduce((sum, i) => sum + i.totalCost, 0);
    const poNum = `PO-2026-${Math.floor(100 + Math.random() * 900)}`;

    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + 7);

    const newPO: PurchaseOrder = {
      id: `po-${Date.now()}`,
      poNumber: poNum,
      supplierName: supplierName || 'Indochina Footwear Crafts & Supply Ltd.',
      supplierContact: 'supply@indochina-footwear.com / +855 23 881 200',
      createdAt: new Date().toISOString(),
      expectedDelivery: deliveryDate.toISOString().split('T')[0],
      items: poItems,
      totalAmount,
      status: 'Draft',
      isAutomated: true,
      notes: `Generated automatically based on real-time stock thresholds (<5 pairs) and Cambodian seasonal velocity metrics.`
    };

    setPurchaseOrders(prev => [newPO, ...prev]);
    savePOToFirestore(newPO).catch(e => console.error('Cloud PO save error:', e));
    return newPO;
  };

  // 7. Update PO Status & Auto Restock when Received
  const updatePOStatus = (poId: string, status: POStatus) => {
    setPurchaseOrders(prev => prev.map(po => {
      if (po.id === poId) {
        // If transitioning to 'Goods Received & Stocked', replenish products
        if (status === 'Goods Received & Stocked' && po.status !== 'Goods Received & Stocked') {
          setProducts(currentProducts => {
            return currentProducts.map(p => {
              const itemsForProduct = po.items.filter(item => item.productId === p.id);
              if (itemsForProduct.length === 0) return p;

              const updatedVariants = p.variants.map(v => {
                const restockMatch = itemsForProduct.find(
                  item => item.size === v.size && item.color === v.color
                );
                if (restockMatch) {
                  return { ...v, stock: v.stock + restockMatch.reorderQty };
                }
                return v;
              });

              const totalStock = updatedVariants.reduce((sum, v) => sum + v.stock, 0);
              const restockedP = { ...p, variants: updatedVariants, totalStock };
              saveProductToFirestore(restockedP).catch(e => console.error('Cloud restock error:', e));
              return restockedP;
            });
          });
        }
        const updatedPO = { ...po, status };
        savePOToFirestore(updatedPO).catch(e => console.error('Cloud PO update error:', e));
        return updatedPO;
      }
      return po;
    }));
  };

  // 8. Update Order Tracking Status
  const updateOrderStatus = (
    orderId: string, 
    newStatus: OrderStatus, 
    note?: string, 
    location?: string,
    courierName?: string,
    courierPhone?: string
  ) => {
    setOrders(prev => prev.map(order => {
      if (order.id === orderId) {
        const newStep: TrackingStep = {
          status: newStatus,
          timestamp: new Date().toISOString(),
          location: location || (order.locationType === 'Phnom Penh' ? 'Phnom Penh Urban Route' : `${order.provinceName || 'Provincial'} Logistics Hub`),
          note: note || `Order status updated to ${newStatus}`
        };

        const updatedOrder: SaleOrder = {
          ...order,
          orderStatus: newStatus,
          courierName: courierName || order.courierName,
          courierPhone: courierPhone || order.courierPhone,
          paymentStatus: (newStatus === 'Delivered' && order.paymentMethod === 'Cash on Delivery (COD)') ? 'Paid' : order.paymentStatus,
          trackingHistory: [...order.trackingHistory, newStep]
        };

        saveOrderToFirestore(updatedOrder).catch(e => console.error('Cloud order update error:', e));
        return updatedOrder;
      }
      return order;
    }));
  };

  const clearAllData = () => {
    products.forEach(p => {
      markProductAsDeleted(p.id);
      deleteProductFromFirestore(p.id).catch(e => console.error('Cloud product clear error:', e));
    });
    setProducts([]);
    setOrders([]);
    setPurchaseOrders([]);
    setCart([]);
    localStorage.removeItem(STORAGE_KEY_PRODUCTS);
    localStorage.removeItem(STORAGE_KEY_ORDERS);
    localStorage.removeItem(STORAGE_KEY_PO);
    localStorage.removeItem(STORAGE_KEY_CART);
  };

  const restoreAllData = (data: { products?: ShoeProduct[]; orders?: SaleOrder[]; purchaseOrders?: PurchaseOrder[] }) => {
    if (data.products && Array.isArray(data.products)) {
      setProducts(data.products.map(p => ({
        ...p,
        totalStock: p.variants.reduce((sum, v) => sum + v.stock, 0)
      })));
    }
    if (data.orders && Array.isArray(data.orders)) {
      setOrders(data.orders);
    }
    if (data.purchaseOrders && Array.isArray(data.purchaseOrders)) {
      setPurchaseOrders(data.purchaseOrders);
    }
  };

  const syncAllLocalToCloud = async () => {
    try {
      await seedLocalItemsToFirestore(products, orders, purchaseOrders);
      console.log('Successfully synced all local items to Firestore!');
    } catch (e) {
      console.error('Failed syncing local items to cloud:', e);
    }
  };

  const resetDemoData = clearAllData;

  return (
    <InventoryContext.Provider
      value={{
        products,
        orders,
        purchaseOrders,
        lowStockItems,
        cart,
        totalInventoryCount,
        totalRevenue,
        totalProfit,
        totalSoldUnits,
        totalCartItems,
        totalCartAmount,
        totalCartCost,
        totalCartProfit,
        addToCart,
        removeFromCart,
        updateCartQuantity,
        clearCart,
        recordSale,
        recordMultiSale,
        addProduct,
        updateProduct,
        deleteProduct,
        updateVariantStock,
        generateAutomatedPO,
        updatePOStatus,
        updateOrderStatus,
        categories,
        modelSkus,
        addCategory,
        updateCategory,
        deleteCategory,
        addModelSku,
        updateModelSku,
        deleteModelSku,
        clearOldDefaults,
        resetDemoData,
        clearAllData,
        restoreAllData,
        syncAllLocalToCloud,
        isCloudConnected
      }}
    >
      {children}
    </InventoryContext.Provider>
  );
};

export const useInventory = () => {
  const context = useContext(InventoryContext);
  if (!context) {
    throw new Error('useInventory must be used within an InventoryProvider');
  }
  return context;
};
