import React, { createContext, useContext, useState, useEffect } from 'react';
import { ShoeProduct, SaleOrder, PurchaseOrder } from '../types';
import {
  CloudflareConfig,
  getLocalCloudflareConfig,
  saveLocalCloudflareConfig,
  fetchCloudflareStatus,
  initCloudflareD1Schema,
  pushDataToCloudflare,
  pullDataFromCloudflare,
  uploadImageToCloudflareR2
} from '../services/cloudflareService';

interface CloudflareContextType {
  config: CloudflareConfig;
  isConfigured: boolean;
  isSyncing: boolean;
  syncStatus: 'idle' | 'syncing' | 'synced' | 'error';
  syncError: string | null;
  d1Status: boolean;
  r2Status: boolean;
  lastSyncTime: string | null;
  updateConfig: (newConfig: Partial<CloudflareConfig>) => void;
  testConnection: (cfg?: CloudflareConfig) => Promise<{ d1Connected: boolean; r2Connected: boolean; message: string }>;
  initSchema: (cfg?: CloudflareConfig) => Promise<boolean>;
  syncToCloudflare: (
    products: ShoeProduct[],
    orders: SaleOrder[],
    purchaseOrders: PurchaseOrder[],
    storeSettings?: { storeName?: string; storeLogo?: string; customCategories?: string[]; customSkus?: string[] }
  ) => Promise<boolean>;
  syncFromCloudflare: () => Promise<{
    products: ShoeProduct[];
    orders: SaleOrder[];
    purchaseOrders: PurchaseOrder[];
    storeSettings?: { storeName?: string; storeLogo?: string; customCategories?: string[]; customSkus?: string[] };
  } | null>;
  uploadProductPhoto: (base64Data: string, filename: string) => Promise<string>;
}

const CloudflareContext = createContext<CloudflareContextType | undefined>(undefined);

const LAST_SYNC_KEY = 'soletrack_cloudflare_last_sync';

export const CloudflareProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<CloudflareConfig>(getLocalCloudflareConfig());
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'synced' | 'error'>('idle');
  const [syncError, setSyncError] = useState<string | null>(null);
  const [d1Status, setD1Status] = useState<boolean>(false);
  const [r2Status, setR2Status] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(() => localStorage.getItem(LAST_SYNC_KEY));

  const isConfigured = Boolean(config.accountId && config.apiToken && config.d1DatabaseId);

  // Test status on mount or config update
  useEffect(() => {
    let isMounted = true;
    if (isConfigured) {
      fetchCloudflareStatus(config).then(res => {
        if (isMounted) {
          setD1Status(Boolean(res.d1Connected));
          setR2Status(Boolean(res.r2Connected));
        }
      }).catch(err => {
        if (isMounted) console.warn('Cloudflare status check failed:', err);
      });
    } else {
      setD1Status(false);
      setR2Status(false);
    }
    return () => { isMounted = false; };
  }, [config]);

  const updateConfig = (newConfig: Partial<CloudflareConfig>) => {
    const updated = saveLocalCloudflareConfig(newConfig);
    setConfig(updated);
  };

  const testConnection = async (cfg?: CloudflareConfig) => {
    const targetConfig = cfg || config;
    setIsSyncing(true);
    try {
      const status = await fetchCloudflareStatus(targetConfig);
      setD1Status(Boolean(status.d1Connected));
      setR2Status(Boolean(status.r2Connected));
      return status;
    } finally {
      setIsSyncing(false);
    }
  };

  const initSchema = async (cfg?: CloudflareConfig) => {
    setIsSyncing(true);
    try {
      const res = await initCloudflareD1Schema(cfg || config);
      if (res.success) {
        setSyncStatus('synced');
        return true;
      } else {
        setSyncError(res.message || 'D1 Schema Init Failed');
        setSyncStatus('error');
        return false;
      }
    } finally {
      setIsSyncing(false);
    }
  };

  const syncToCloudflare = async (
    products: ShoeProduct[],
    orders: SaleOrder[],
    purchaseOrders: PurchaseOrder[],
    storeSettings?: { storeName?: string; storeLogo?: string; customCategories?: string[]; customSkus?: string[] }
  ) => {
    setIsSyncing(true);
    setSyncStatus('syncing');
    setSyncError(null);
    try {
      const res = await pushDataToCloudflare(products, orders, purchaseOrders, storeSettings, config);
      if (res.success) {
        setSyncStatus('synced');
        const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        setLastSyncTime(nowStr);
        localStorage.setItem(LAST_SYNC_KEY, nowStr);
        return true;
      } else {
        setSyncError(res.message || 'Push sync failed');
        setSyncStatus('error');
        return false;
      }
    } catch (err: any) {
      setSyncError(err.message || 'Sync error');
      setSyncStatus('error');
      return false;
    } finally {
      setIsSyncing(false);
    }
  };

  const syncFromCloudflare = async () => {
    setIsSyncing(true);
    setSyncStatus('syncing');
    try {
      const data = await pullDataFromCloudflare(config);
      if (data) {
        setSyncStatus('synced');
        const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        setLastSyncTime(nowStr);
        localStorage.setItem(LAST_SYNC_KEY, nowStr);
        return data;
      } else {
        setSyncStatus('idle');
        return null;
      }
    } catch (err: any) {
      setSyncError(err.message || 'Pull sync error');
      setSyncStatus('error');
      return null;
    } finally {
      setIsSyncing(false);
    }
  };

  const uploadProductPhoto = async (base64Data: string, filename: string): Promise<string> => {
    if (!config.r2BucketName || !r2Status) {
      return base64Data; // fallback to base64 if R2 is not configured
    }
    const res = await uploadImageToCloudflareR2(base64Data, filename, config);
    return res.url;
  };

  return (
    <CloudflareContext.Provider
      value={{
        config,
        isConfigured,
        isSyncing,
        syncStatus,
        syncError,
        d1Status,
        r2Status,
        lastSyncTime,
        updateConfig,
        testConnection,
        initSchema,
        syncToCloudflare,
        syncFromCloudflare,
        uploadProductPhoto
      }}
    >
      {children}
    </CloudflareContext.Provider>
  );
};

export const useCloudflare = () => {
  const ctx = useContext(CloudflareContext);
  if (!ctx) {
    throw new Error('useCloudflare must be used within CloudflareProvider');
  }
  return ctx;
};
