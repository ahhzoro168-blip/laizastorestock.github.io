import React, { useState } from 'react';
import { Settings as SettingsIcon, Store, Shield, Database, Download, Upload, RefreshCcw, Check, Bell, Globe, DollarSign, Layers, Cloud, Sun, Moon } from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { useTheme } from '../context/ThemeContext';
import { CatalogManagerView } from './CatalogManagerView';
import { CloudflareSettingsSection } from './CloudflareSettingsSection';

interface SettingsViewProps {
  onOpenAddModal?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ onOpenAddModal }) => {
  const { products, clearAllData } = useInventory();
  const { theme, toggleTheme, setTheme } = useTheme();
  const [activeSettingsSection, setActiveSettingsSection] = useState<'catalog' | 'general' | 'cloudflare'>('catalog');
  const [storeName, setStoreName] = useState('Laiza Store');
  const [storePhone, setStorePhone] = useState('017 249 041');
  const [currency, setCurrency] = useState('USD ($)');
  const [lowStockLimit, setLowStockLimit] = useState(5);
  const [taxRate, setTaxRate] = useState(0);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [autoSyncCloud, setAutoSyncCloud] = useState(true);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleExportData = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(products, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `laiza_store_inventory_backup_${new Date().toISOString().slice(0,10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleResetData = () => {
    if (window.confirm('Are you sure you want to reset all inventory data? This cannot be undone.')) {
      clearAllData();
      alert('Inventory has been cleared successfully.');
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header Text (Without box and icon) */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-1">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white font-['Plus_Jakarta_Sans'] tracking-tight">
            Store Settings & Control Center
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Manage Model SKUs, Shoe Categories, store profile, currency, and data backups
          </p>
        </div>
        {savedSuccess && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 rounded-xl text-xs font-semibold animate-in fade-in shrink-0">
            <Check className="w-4 h-4" />
            <span>Settings Saved Successfully</span>
          </div>
        )}
      </div>

      {/* Settings Sub-Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        <button
          type="button"
          onClick={() => setActiveSettingsSection('catalog')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSettingsSection === 'catalog'
              ? 'bg-pink-500 text-white shadow-md shadow-pink-500/20'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 border border-slate-200 dark:border-slate-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Model SKU & Categories</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSettingsSection('general')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSettingsSection === 'general'
              ? 'bg-pink-500 text-white shadow-md shadow-pink-500/20'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 border border-slate-200 dark:border-slate-800'
          }`}
        >
          <Store className="w-4 h-4" />
          <span>General Store Preferences</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSettingsSection('cloudflare')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSettingsSection === 'cloudflare'
              ? 'bg-pink-500 text-white shadow-md shadow-pink-500/20'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 border border-slate-200 dark:border-slate-800'
          }`}
        >
          <Cloud className="w-4 h-4 text-pink-400" />
          <span>Cloudflare Storage & D1</span>
        </button>
      </div>

      {/* SECTION 1: MODEL SKU & CATEGORIES */}
      {activeSettingsSection === 'catalog' && (
        <CatalogManagerView onOpenAddModal={onOpenAddModal || (() => {})} />
      )}

      {/* SECTION 2: CLOUDFLARE STORAGE & D1 DATABASE */}
      {activeSettingsSection === 'cloudflare' && (
        <CloudflareSettingsSection />
      )}

      {/* SECTION 2: GENERAL STORE PREFERENCES */}
      {activeSettingsSection === 'general' && (
        <form onSubmit={handleSaveSettings} className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: General & POS Settings */}
        <div className="md:col-span-2 space-y-6">
          
          {/* Store Profile */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4 shadow-sm dark:shadow-lg">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
              <Store className="w-4 h-4 text-pink-500 dark:text-pink-400" />
              <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Store Profile</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Store Name</label>
                <input
                  type="text"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-pink-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Primary Contact / Hotline</label>
                <input
                  type="text"
                  value={storePhone}
                  onChange={(e) => setStorePhone(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-pink-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Store Location / Address</label>
              <input
                type="text"
                defaultValue="Phnom Penh, Cambodia"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-pink-500 transition-colors"
              />
            </div>
          </div>

          {/* POS & Inventory Preferences */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4 shadow-sm dark:shadow-lg">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
              <DollarSign className="w-4 h-4 text-pink-500 dark:text-pink-400" />
              <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">POS & Inventory Preferences</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Primary Currency</label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-pink-500 cursor-pointer"
                >
                  <option value="USD ($)">USD ($)</option>
                  <option value="KHR (៛)">KHR (៛)</option>
                  <option value="USD & KHR">USD & KHR Dual</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Low Stock Threshold</label>
                <input
                  type="number"
                  value={lowStockLimit}
                  onChange={(e) => setLowStockLimit(parseInt(e.target.value) || 1)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-pink-500"
                  min="1"
                  max="20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Sales Tax Rate (%)</label>
                <input
                  type="number"
                  value={taxRate}
                  onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-pink-500"
                  min="0"
                  max="100"
                  step="0.5"
                />
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-900 dark:text-white">Cloud Real-time Auto-Sync</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Keep inventory and sales synced across all connected devices</p>
              </div>
              <button
                type="button"
                onClick={() => setAutoSyncCloud(!autoSyncCloud)}
                className={`w-11 h-6 rounded-full transition-colors relative p-0.5 cursor-pointer ${autoSyncCloud ? 'bg-pink-500' : 'bg-slate-300 dark:bg-slate-800'}`}
              >
                <div className={`w-5 h-5 rounded-full bg-white dark:bg-slate-950 transition-transform ${autoSyncCloud ? 'translate-x-5' : 'translate-x-0'} shadow-sm`} />
              </button>
            </div>
          </div>

        </div>

        {/* Right Col: Theme & Data Management & Actions */}
        <div className="space-y-6">
          
          {/* Appearance & Theme Setting */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4 shadow-sm dark:shadow-lg">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
              <Sun className="w-4 h-4 text-pink-500 dark:text-pink-400" />
              <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Appearance & Theme</h2>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              Select your preferred display theme for the POS register, stock catalog, and analytics.
            </p>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <button
                type="button"
                onClick={() => setTheme('light')}
                className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all cursor-pointer ${
                  theme === 'light'
                    ? 'bg-pink-50/80 border-pink-500 text-pink-700 shadow-sm ring-1 ring-pink-500/30'
                    : 'bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
                }`}
              >
                <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <Sun className="w-4 h-4" />
                </div>
                <div className="text-center">
                  <span className="text-xs font-bold block">Light Theme</span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">Bright workspace</span>
                </div>
                {theme === 'light' && (
                  <span className="text-[10px] font-bold text-pink-600 bg-pink-100 dark:bg-pink-900/40 px-2 py-0.5 rounded-full mt-0.5">Active</span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setTheme('dark')}
                className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all cursor-pointer ${
                  theme === 'dark'
                    ? 'bg-pink-500/10 border-pink-500 text-pink-300 shadow-sm ring-1 ring-pink-500/30'
                    : 'bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
                }`}
              >
                <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <Moon className="w-4 h-4" />
                </div>
                <div className="text-center">
                  <span className="text-xs font-bold block">Dark Theme</span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">Night & low glare</span>
                </div>
                {theme === 'dark' && (
                  <span className="text-[10px] font-bold text-pink-400 bg-pink-500/20 px-2 py-0.5 rounded-full mt-0.5">Active</span>
                )}
              </button>
            </div>

            <div className="pt-2 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
              <div>
                <p className="text-xs font-semibold text-slate-900 dark:text-white">Switch Theme</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Current: {theme === 'light' ? 'Light Theme' : 'Dark Theme'}</p>
              </div>
              <button
                type="button"
                onClick={toggleTheme}
                className={`w-11 h-6 rounded-full transition-colors relative p-0.5 cursor-pointer ${theme === 'dark' ? 'bg-pink-500' : 'bg-slate-300 dark:bg-slate-800'}`}
                title={`Toggle to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
                aria-label="Toggle theme switch"
              >
                <div className={`w-5 h-5 rounded-full bg-white dark:bg-slate-950 transition-transform ${theme === 'dark' ? 'translate-x-5' : 'translate-x-0'} shadow-sm flex items-center justify-center`}>
                  {theme === 'dark' ? (
                    <Moon className="w-3 h-3 text-pink-400" />
                  ) : (
                    <Sun className="w-3 h-3 text-amber-500" />
                  )}
                </div>
              </button>
            </div>
          </div>
          
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4 shadow-sm dark:shadow-lg">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
              <Database className="w-4 h-4 text-pink-500 dark:text-pink-400" />
              <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Data & Backup</h2>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              Download backup JSON files of your complete shoe stock catalog and sales history or reset data.
            </p>

            <div className="space-y-3 pt-1">
              <button
                type="button"
                onClick={handleExportData}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold transition-colors border border-slate-200 dark:border-slate-700/60 shadow-sm cursor-pointer"
              >
                <Download className="w-4 h-4 text-pink-500 dark:text-pink-400" />
                <span>Export JSON Backup</span>
              </button>

              <button
                type="button"
                onClick={handleResetData}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 rounded-xl text-xs font-semibold transition-colors border border-rose-500/30 cursor-pointer"
              >
                <RefreshCcw className="w-4 h-4" />
                <span>Reset All Inventory</span>
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm dark:shadow-lg flex flex-col gap-3">
            <button
              type="submit"
              className="w-full py-3 bg-pink-500 hover:bg-pink-400 text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-pink-500/20 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>Save Changes</span>
            </button>
          </div>

        </div>

      </form>
      )}
    </div>
  );
};
