import React, { useState } from 'react';
import {
  Cloud,
  Database,
  HardDrive,
  CheckCircle2,
  XCircle,
  Key,
  Layers,
  HelpCircle,
  UploadCloud,
  DownloadCloud,
  ShieldCheck,
  Globe,
  RefreshCw,
  X
} from 'lucide-react';
import { useCloudflare } from '../context/CloudflareContext';
import { useInventory } from '../context/InventoryContext';

export const CloudflareSettingsSection: React.FC = () => {
  const {
    config,
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
    syncFromCloudflare
  } = useCloudflare();

  const { products, orders, purchaseOrders, restoreAllData } = useInventory();

  // Local form state for settings
  const [accountId, setAccountId] = useState(config.accountId);
  const [apiToken, setApiToken] = useState(config.apiToken);
  const [d1DatabaseId, setD1DatabaseId] = useState(config.d1DatabaseId);
  const [r2BucketName, setR2BucketName] = useState(config.r2BucketName);
  const [r2PublicDomain, setR2PublicDomain] = useState(config.r2PublicDomain || '');
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(config.autoSyncEnabled);

  const [activeTab, setActiveTab] = useState<'control' | 'credentials' | 'guide'>('control');
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    const newCfg = {
      accountId: accountId.trim(),
      apiToken: apiToken.trim(),
      d1DatabaseId: d1DatabaseId.trim(),
      r2BucketName: r2BucketName.trim(),
      r2PublicDomain: r2PublicDomain.trim(),
      autoSyncEnabled
    };
    updateConfig(newCfg);
    setStatusMsg({ type: 'info', text: 'Testing Cloudflare connection...' });
    const res = await testConnection(newCfg);
    if (res.d1Connected) {
      setStatusMsg({ type: 'success', text: 'Successfully connected to Cloudflare D1 Database & Storage!' });
    } else {
      setStatusMsg({ type: 'error', text: res.message || 'Failed connecting to Cloudflare. Please check API credentials.' });
    }
  };

  const handleInitDatabaseSchema = async () => {
    setStatusMsg({ type: 'info', text: 'Initializing Cloudflare D1 database tables...' });
    const ok = await initSchema();
    if (ok) {
      setStatusMsg({ type: 'success', text: 'Cloudflare D1 SQL tables created successfully!' });
    } else {
      setStatusMsg({ type: 'error', text: 'Failed creating tables in D1. Ensure API Token has D1 Edit permission.' });
    }
  };

  const handlePushToCloudflare = async () => {
    setStatusMsg({ type: 'info', text: 'Uploading inventory data to Cloudflare D1...' });
    const ok = await syncToCloudflare(products, orders, purchaseOrders);
    if (ok) {
      setStatusMsg({ type: 'success', text: `Uploaded ${products.length} products to Cloudflare D1!` });
    } else {
      setStatusMsg({ type: 'error', text: syncError || 'Push failed. Please check Cloudflare configuration.' });
    }
  };

  const handlePullFromCloudflare = async () => {
    setStatusMsg({ type: 'info', text: 'Fetching stock data from Cloudflare D1...' });
    const data = await syncFromCloudflare();
    if (data) {
      restoreAllData(data);
      setStatusMsg({ type: 'success', text: `Downloaded ${data.products.length} products from Cloudflare!` });
    } else {
      setStatusMsg({ type: 'error', text: 'Pull failed or no data found on Cloudflare D1.' });
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner Card */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-pink-500/10 via-white to-white dark:via-slate-900 dark:to-slate-900 border border-slate-200 dark:border-pink-500/20 shadow-sm dark:shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-pink-500/10 border border-pink-500/30 flex items-center justify-center text-pink-500 dark:text-pink-400 shrink-0 shadow-inner">
            <Cloud className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white font-['Plus_Jakarta_Sans'] flex items-center gap-2">
              Cloudflare Storage & D1 Database
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Sync footwear catalog, walk-in sales, and photo assets across all devices
            </p>
          </div>
        </div>

        {/* Action Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-950/80 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={() => setActiveTab('control')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'control'
                ? 'bg-pink-500 text-white font-bold shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Sync Control
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('credentials')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'credentials'
                ? 'bg-pink-500 text-white font-bold shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            API Credentials
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('guide')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'guide'
                ? 'bg-pink-500 text-white font-bold shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Setup Guide
          </button>
        </div>
      </div>

      {/* Notification Banner */}
      {statusMsg && (
        <div className={`px-4 py-3 rounded-xl text-xs font-semibold flex items-center justify-between ${
          statusMsg.type === 'success' ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400' :
          statusMsg.type === 'error' ? 'bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400' :
          'bg-sky-500/10 border border-sky-500/20 text-sky-600 dark:text-sky-400'
        }`}>
          <span>{statusMsg.text}</span>
          <button onClick={() => setStatusMsg(null)} className="text-current opacity-70 hover:opacity-100">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* TAB 1: SYNC CONTROL */}
      {activeTab === 'control' && (
        <div className="space-y-6">
          
          {/* Cloudflare Connection Badges */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* D1 Database Status */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-sm dark:shadow-md">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-500 dark:text-pink-400 shrink-0">
                  <Database className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">Cloudflare D1 SQL</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Database Engine</p>
                </div>
              </div>
              {d1Status ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-[11px] font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Connected</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-[11px] font-semibold">
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Local Proxy</span>
                </span>
              )}
            </div>

            {/* R2 Storage Status */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-sm dark:shadow-md">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-500 dark:text-sky-400 shrink-0">
                  <HardDrive className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">Cloudflare R2</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Object Storage</p>
                </div>
              </div>
              {r2Status ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-[11px] font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Connected</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-[11px] font-semibold">
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Local Storage</span>
                </span>
              )}
            </div>
          </div>

          {/* D1 Table Schema Initialization Card */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4 shadow-sm dark:shadow-md">
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">1. Initialize D1 Database Schema</h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Automatically create SQL tables (`products`, `orders`, `purchase_orders`) on Cloudflare D1.
              </p>
            </div>
            <button
              type="button"
              onClick={handleInitDatabaseSchema}
              disabled={isSyncing}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer shrink-0 disabled:opacity-50 border border-slate-200 dark:border-slate-700"
            >
              <Layers className="w-4 h-4 text-pink-500 dark:text-pink-400" />
              <span>Init Tables</span>
            </button>
          </div>

          {/* Manual Push / Pull Control Box */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm dark:shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">Multi-Device Stock Control & Sync</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Push your shoe catalog and order records to Cloudflare D1 or pull updates onto this device.
                </p>
              </div>
              {lastSyncTime && (
                <span className="text-[11px] text-slate-600 dark:text-slate-400 font-mono bg-slate-100 dark:bg-slate-950 px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-800">
                  Last Sync: {lastSyncTime}
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              
              {/* Push to Cloudflare */}
              <button
                type="button"
                onClick={handlePushToCloudflare}
                disabled={isSyncing}
                className="py-3 px-4 rounded-xl bg-pink-500 hover:bg-pink-400 disabled:opacity-50 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-pink-500/20 cursor-pointer active:scale-95"
              >
                <UploadCloud className="w-4 h-4 stroke-[2.5]" />
                <span>Push Inventory to Cloudflare D1</span>
              </button>

              {/* Pull from Cloudflare */}
              <button
                type="button"
                onClick={handlePullFromCloudflare}
                disabled={isSyncing}
                className="py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 disabled:opacity-50 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95"
              >
                <DownloadCloud className="w-4 h-4 text-pink-500 dark:text-pink-400 stroke-[2.5]" />
                <span>Pull Inventory from Cloudflare D1</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CREDENTIALS FORM */}
      {activeTab === 'credentials' && (
        <form onSubmit={handleSaveSettings} className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 text-xs shadow-sm dark:shadow-lg">
          
          {/* Account ID */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
              <span>Cloudflare Account ID *</span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-normal">Dash -&gt; Workers -&gt; Account ID</span>
            </label>
            <input
              type="text"
              placeholder="e.g. 9b123a456c7890d123e456f7890a123b"
              value={accountId}
              onChange={e => setAccountId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-pink-500 font-mono text-xs"
            />
          </div>

          {/* API Token */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
              <span>Cloudflare API Token *</span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-normal">Token with D1 Edit & R2 Edit permissions</span>
            </label>
            <input
              type="password"
              placeholder="e.g. xYz123_AbCdEfGhIjKlMnOpQrStUvWxYz"
              value={apiToken}
              onChange={e => setApiToken(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-pink-500 font-mono text-xs"
            />
          </div>

          {/* D1 Database ID */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
              <span>Cloudflare D1 Database ID *</span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-normal">Dash -&gt; D1 Database ID</span>
            </label>
            <input
              type="text"
              placeholder="e.g. 12345678-abcd-1234-efgh-1234567890ab"
              value={d1DatabaseId}
              onChange={e => setD1DatabaseId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-pink-500 font-mono text-xs"
            />
          </div>

          {/* R2 Bucket Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
              <span>Cloudflare R2 Bucket Name (Optional)</span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-normal">Object storage for high-res photos</span>
            </label>
            <input
              type="text"
              placeholder="e.g. laiza-store-shoe-images"
              value={r2BucketName}
              onChange={e => setR2BucketName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-pink-500 font-mono text-xs"
            />
          </div>

          {/* R2 Public Domain */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
              <span>R2 Public Domain / CDN URL (Optional)</span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-normal">e.g. https://pub-xxx.r2.dev</span>
            </label>
            <input
              type="text"
              placeholder="e.g. https://pub-xxx.r2.dev"
              value={r2PublicDomain}
              onChange={e => setR2PublicDomain(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-pink-500 font-mono text-xs"
            />
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={isSyncing}
              className="py-2.5 px-6 rounded-xl bg-pink-500 hover:bg-pink-400 text-white text-xs font-bold flex items-center gap-2 transition-all shadow-lg shadow-pink-500/20 cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Save & Test Connection</span>
            </button>
          </div>
        </form>
      )}

      {/* TAB 3: SETUP GUIDE */}
      {activeTab === 'guide' && (
        <div className="space-y-4 text-xs text-slate-700 dark:text-slate-300">
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 shadow-sm dark:shadow-lg">
            <h4 className="font-bold text-pink-500 dark:text-pink-400 flex items-center gap-2 text-sm">
              <Globe className="w-4 h-4" />
              <span>How to create your Cloudflare D1 Database</span>
            </h4>
            <ol className="list-decimal list-inside space-y-1.5 text-slate-600 dark:text-slate-300 pl-1 pt-1">
              <li>Log in to your <strong><a href="https://dash.cloudflare.com" target="_blank" rel="noreferrer" className="text-pink-500 dark:text-pink-400 underline">Cloudflare Dashboard</a></strong>.</li>
              <li>In the sidebar, click <strong>Workers &amp; Pages</strong> -&gt; <strong>D1 Database</strong>.</li>
              <li>Click <strong>Create Database</strong> and name it <code className="text-pink-600 dark:text-pink-300 bg-slate-100 dark:bg-slate-950 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-800">laiza-store-db</code>.</li>
              <li>Copy your <strong>Account ID</strong> and <strong>Database ID</strong> into the Credentials tab.</li>
              <li>Create an <strong>API Token</strong> with <em>D1 Edit</em> and <em>R2 Edit</em> permissions under My Profile -&gt; API Tokens.</li>
            </ol>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 shadow-sm dark:shadow-lg">
            <h4 className="font-bold text-sky-500 dark:text-sky-400 flex items-center gap-2 text-sm">
              <HardDrive className="w-4 h-4" />
              <span>How to setup Cloudflare R2 Object Storage (Photos)</span>
            </h4>
            <ol className="list-decimal list-inside space-y-1.5 text-slate-600 dark:text-slate-300 pl-1 pt-1">
              <li>Go to <strong>R2 Object Storage</strong> in the Cloudflare sidebar.</li>
              <li>Click <strong>Create Bucket</strong> and name it <code className="text-sky-600 dark:text-sky-300 bg-slate-100 dark:bg-slate-950 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-800">laiza-store-shoe-images</code>.</li>
              <li>In bucket settings, enable <strong>Public Access</strong> or custom domain to display product photos on all devices.</li>
            </ol>
          </div>
        </div>
      )}

    </div>
  );
};
