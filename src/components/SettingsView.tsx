import React, { useState } from 'react';
import { Settings as SettingsIcon, Store, Shield, Database, Download, Upload, RefreshCcw, Check, Bell, Globe, DollarSign } from 'lucide-react';
import { useInventory } from '../context/InventoryContext';

export const SettingsView: React.FC = () => {
  const { products, clearAllData } = useInventory();
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
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl">
            <SettingsIcon className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white font-['Syne']">
              Store Settings & Control Center
            </h1>
            <p className="text-xs text-slate-400">
              Manage store profile, currency, POS preferences, and data backups
            </p>
          </div>
        </div>
        {savedSuccess && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl text-xs font-semibold animate-in fade-in">
            <Check className="w-4 h-4" />
            <span>Settings Saved Successfully</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSaveSettings} className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: General & POS Settings */}
        <div className="md:col-span-2 space-y-6">
          
          {/* Store Profile */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4 shadow-lg">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800">
              <Store className="w-4 h-4 text-amber-400" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">Store Profile</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Store Name</label>
                <input
                  type="text"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Primary Contact / Hotline</label>
                <input
                  type="text"
                  value={storePhone}
                  onChange={(e) => setStorePhone(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Store Location / Address</label>
              <input
                type="text"
                defaultValue="Phnom Penh, Cambodia"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400 transition-colors"
              />
            </div>
          </div>

          {/* POS & Inventory Preferences */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4 shadow-lg">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800">
              <DollarSign className="w-4 h-4 text-amber-400" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">POS & Inventory Preferences</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Primary Currency</label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
                >
                  <option value="USD ($)">USD ($)</option>
                  <option value="KHR (៛)">KHR (៛)</option>
                  <option value="USD & KHR">USD & KHR Dual</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Low Stock Threshold</label>
                <input
                  type="number"
                  value={lowStockLimit}
                  onChange={(e) => setLowStockLimit(parseInt(e.target.value) || 1)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
                  min="1"
                  max="20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Sales Tax Rate (%)</label>
                <input
                  type="number"
                  value={taxRate}
                  onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
                  min="0"
                  max="100"
                  step="0.5"
                />
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-white">Cloud Real-time Auto-Sync</p>
                <p className="text-[11px] text-slate-400">Keep inventory and sales synced across all connected devices</p>
              </div>
              <button
                type="button"
                onClick={() => setAutoSyncCloud(!autoSyncCloud)}
                className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${autoSyncCloud ? 'bg-amber-500' : 'bg-slate-800'}`}
              >
                <div className={`w-5 h-5 rounded-full bg-slate-950 transition-transform ${autoSyncCloud ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </div>
          </div>

        </div>

        {/* Right Col: Data Management & Actions */}
        <div className="space-y-6">
          
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4 shadow-lg">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800">
              <Database className="w-4 h-4 text-amber-400" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">Data & Backup</h2>
            </div>

            <p className="text-xs text-slate-400">
              Download backup JSON files of your complete shoe stock catalog and sales history or reset data.
            </p>

            <div className="space-y-3 pt-1">
              <button
                type="button"
                onClick={handleExportData}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition-colors border border-slate-700/60 shadow-sm"
              >
                <Download className="w-4 h-4 text-amber-400" />
                <span>Export JSON Backup</span>
              </button>

              <button
                type="button"
                onClick={handleResetData}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-xl text-xs font-semibold transition-colors border border-rose-500/30"
              >
                <RefreshCcw className="w-4 h-4" />
                <span>Reset All Inventory</span>
              </button>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col gap-3">
            <button
              type="submit"
              className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-md shadow-amber-500/20 flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>Save Changes</span>
            </button>
          </div>

        </div>

      </form>
    </div>
  );
};
