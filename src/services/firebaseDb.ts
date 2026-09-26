import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  deleteDoc, 
  collection, 
  onSnapshot, 
  getDocFromServer,
  writeBatch
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { ShoeProduct, SaleOrder, PurchaseOrder } from '../types';

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Use the specific firestoreDatabaseId if configured, else default
export const db = firebaseConfig.firestoreDatabaseId 
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

// Connection test on initial boot per Firebase integration guidelines
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error: any) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firestore is currently running in offline/cached mode.');
    }
    return false;
  }
}

testFirestoreConnection();

/**
 * Real-time listener for Shoe Products across all devices
 */
export function subscribeToProducts(
  onUpdate: (products: ShoeProduct[]) => void,
  onError?: (err: Error) => void
) {
  const colRef = collection(db, 'products');
  return onSnapshot(
    colRef,
    (snapshot) => {
      const items: ShoeProduct[] = [];
      snapshot.forEach((d) => {
        items.push(d.data() as ShoeProduct);
      });
      // Sort newest first
      items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      onUpdate(items);
    },
    (err) => {
      console.error('Firestore products snapshot error:', err);
      if (onError) onError(err);
    }
  );
}

/**
 * Real-time listener for Orders across all devices
 */
export function subscribeToOrders(
  onUpdate: (orders: SaleOrder[]) => void,
  onError?: (err: Error) => void
) {
  const colRef = collection(db, 'orders');
  return onSnapshot(
    colRef,
    (snapshot) => {
      const items: SaleOrder[] = [];
      snapshot.forEach((d) => {
        items.push(d.data() as SaleOrder);
      });
      items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      onUpdate(items);
    },
    (err) => {
      console.error('Firestore orders snapshot error:', err);
      if (onError) onError(err);
    }
  );
}

/**
 * Real-time listener for Purchase Orders
 */
export function subscribeToPurchaseOrders(
  onUpdate: (orders: PurchaseOrder[]) => void,
  onError?: (err: Error) => void
) {
  const colRef = collection(db, 'purchase_orders');
  return onSnapshot(
    colRef,
    (snapshot) => {
      const items: PurchaseOrder[] = [];
      snapshot.forEach((d) => {
        items.push(d.data() as PurchaseOrder);
      });
      items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      onUpdate(items);
    },
    (err) => {
      console.error('Firestore purchase_orders snapshot error:', err);
      if (onError) onError(err);
    }
  );
}

/**
 * Remove any 'undefined' properties recursively so Firestore setDoc / batch.set
 * never throws "Unsupported field value: undefined" errors.
 */
function sanitizeForFirestore<T>(data: T): T {
  if (data === null || data === undefined) return data;
  return JSON.parse(
    JSON.stringify(data, (_key, value) => (value === undefined ? null : value))
  );
}

/**
 * Save / Update a product to Firestore
 */
export async function saveProductToFirestore(product: ShoeProduct): Promise<void> {
  const docRef = doc(db, 'products', product.id);
  const cleanData = sanitizeForFirestore(product);
  await setDoc(docRef, cleanData, { merge: true });
}

/**
 * Delete a product from Firestore
 */
export async function deleteProductFromFirestore(productId: string): Promise<void> {
  const docRef = doc(db, 'products', productId);
  await deleteDoc(docRef);
}

/**
 * Save / Update a sales order to Firestore
 */
export async function saveOrderToFirestore(order: SaleOrder): Promise<void> {
  const docRef = doc(db, 'orders', order.id);
  const cleanData = sanitizeForFirestore(order);
  await setDoc(docRef, cleanData, { merge: true });
}

/**
 * Save / Update a purchase order to Firestore
 */
export async function savePOToFirestore(po: PurchaseOrder): Promise<void> {
  const docRef = doc(db, 'purchase_orders', po.id);
  const cleanData = sanitizeForFirestore(po);
  await setDoc(docRef, cleanData, { merge: true });
}

export interface StoreConfig {
  customCategories?: string[];
  customSkus?: string[];
}

/**
 * Real-time listener for Store Configuration (SKUs, Categories)
 */
export function subscribeToStoreSettings(
  onUpdate: (config: StoreConfig) => void
) {
  const docRef = doc(db, 'settings', 'store_config');
  return onSnapshot(
    docRef,
    (snapshot) => {
      if (snapshot.exists()) {
        onUpdate(snapshot.data() as StoreConfig);
      }
    },
    (err) => {
      console.error('Firestore store_config snapshot error:', err);
    }
  );
}

/**
 * Save store settings to Firestore
 */
export async function saveStoreSettingsToFirestore(config: StoreConfig): Promise<void> {
  const docRef = doc(db, 'settings', 'store_config');
  const cleanData = sanitizeForFirestore(config);
  await setDoc(docRef, cleanData, { merge: true });
}

/**
 * Batch upload existing local items to Firestore if cloud is currently empty
 */
export async function seedLocalItemsToFirestore(
  products: ShoeProduct[],
  orders: SaleOrder[],
  purchaseOrders: PurchaseOrder[]
): Promise<void> {
  if (products.length === 0 && orders.length === 0 && purchaseOrders.length === 0) return;

  const batch = writeBatch(db);
  products.forEach((p) => {
    batch.set(doc(db, 'products', p.id), sanitizeForFirestore(p), { merge: true });
  });
  orders.forEach((o) => {
    batch.set(doc(db, 'orders', o.id), sanitizeForFirestore(o), { merge: true });
  });
  purchaseOrders.forEach((po) => {
    batch.set(doc(db, 'purchase_orders', po.id), sanitizeForFirestore(po), { merge: true });
  });

  await batch.commit();
}
