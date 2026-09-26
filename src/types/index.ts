export type ShoeGender = 'men' | 'women' | 'unisex';

export type ShoeColor = 'Black' | 'White' | 'Navy' | 'Beige' | 'ខ្មៅ' | 'ស' | string;

export type ShoeCategory = 
  | 'Sneakers'
  | 'Formal & Loafers'
  | 'Running & Athletic'
  | 'Boots & Outdoor'
  | 'Casual & Lifestyle'
  | string;

export interface ShoeVariant {
  sku: string;
  size: number;
  color: ShoeColor;
  stock: number;
  minThreshold: number;
  salesCount: number;
}

export interface ShoeSpecifications {
  upperMaterial: string;
  soleMaterial: string;
  cushioning: string;
  weightGrams: number;
  origin: string;
  careInstructions: string;
}

export interface ShoeProduct {
  id: string;
  name: string;
  sku: string;
  gender: ShoeGender;
  category: ShoeCategory;
  costPrice: number;
  retailPrice: number;
  images: string[];
  colorImages?: Partial<Record<ShoeColor, string>>;
  description: string;
  specifications: ShoeSpecifications;
  variants: ShoeVariant[];
  totalStock: number;
  popularScore: number; // 0 - 100
  createdAt: string;
  tags: string[];
}

export type LocationType = 'Phnom Penh' | 'Province';

export type OrderPlatform = 'Walk-in' | 'Page' | 'Telegram' | 'TikTok';

export type PhnomPenhPaymentMethod = 'Bank Transfer' | 'Cash on Delivery (COD)';

export type ProvincePaymentMethod = 'Bank Transfer';

export type OrderStatus = 
  | 'Confirmed'
  | 'Packing'
  | 'Dispatched'
  | 'Out for Delivery'
  | 'Delivered'
  | 'Cancelled';

export interface TrackingStep {
  status: OrderStatus;
  timestamp: string;
  location: string;
  note: string;
}

export interface CartItem {
  id: string; // unique key: `${productId}-${size}-${color}`
  productId: string;
  productName: string;
  sku: string;
  productImage: string;
  gender: ShoeGender;
  category: ShoeCategory;
  size: number;
  color: ShoeColor;
  quantity: number;
  unitPrice: number;
  costPrice: number;
  stock: number;
}

export interface SaleOrderItem {
  productId: string;
  productName: string;
  sku: string;
  productImage: string;
  gender: ShoeGender;
  category: ShoeCategory;
  size: number;
  color: ShoeColor;
  quantity: number;
  unitPrice: number;
  costPrice: number;
  totalAmount: number;
  profit: number;
}

export interface RecordMultiSaleInput {
  items: CartItem[];
  customerName: string;
  customerPhone: string;
  ownerPhone?: string;
  orderPlatform?: OrderPlatform;
  locationType: LocationType;
  provinceName?: string;
  district?: string;
  deliveryAddress: string;
  paymentMethod: string;
  paymentStatus: 'Paid' | 'Pending' | 'COD - Due on Arrival';
  notes?: string;
}

export interface SaleOrder {
  id: string;
  orderNumber: string;
  productId: string;
  productName: string;
  productImage: string;
  gender: ShoeGender;
  category: ShoeCategory;
  size: number;
  color: ShoeColor;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  costPrice: number;
  profit: number;
  items?: SaleOrderItem[];
  itemCount?: number;
  orderPlatform?: OrderPlatform;
  locationType: LocationType;
  provinceName?: string;
  district?: string;
  deliveryAddress: string;
  customerName: string;
  customerPhone: string;
  ownerPhone?: string;
  paymentMethod: string;
  paymentStatus: 'Paid' | 'Pending' | 'COD - Due on Arrival';
  orderStatus: OrderStatus;
  trackingHistory: TrackingStep[];
  courierName?: string;
  courierPhone?: string;
  createdAt: string;
  notes?: string;
}

export type POStatus = 'Draft' | 'Sent to Supplier' | 'Goods Received & Stocked';

export interface PurchaseOrderItem {
  productId: string;
  productName: string;
  productSku: string;
  size: number;
  color: ShoeColor;
  currentStock: number;
  reorderQty: number;
  unitCost: number;
  totalCost: number;
  reason: 'Low Stock Threshold' | 'High Velocity Surge' | 'Seasonal Demand Forecast';
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplierName: string;
  supplierContact: string;
  createdAt: string;
  expectedDelivery: string;
  items: PurchaseOrderItem[];
  totalAmount: number;
  status: POStatus;
  isAutomated: boolean;
  notes: string;
}

export interface SeasonalTrend {
  seasonName: string;
  months: string;
  description: string;
  demandFactor: number;
  bestSellingCategories: string[];
  recommendedColors: ShoeColor[];
  topSizeMen: number[];
  topSizeWomen: number[];
  advice: string;
}
