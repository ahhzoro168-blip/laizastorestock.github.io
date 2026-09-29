import React, { useState, useEffect, useRef } from 'react';
import { 
  Settings as SettingsIcon, 
  Store, 
  Shield, 
  Database, 
  Download, 
  Upload, 
  RefreshCcw, 
  Check, 
  Bell, 
  Globe, 
  Layers, 
  Cloud, 
  Sun, 
  Moon,
  Camera,
  RotateCcw,
  Sparkles,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  ChevronRight
} from 'lucide-react';
import { useInventory, DEFAULT_STORE_LOGO } from '../context/InventoryContext';
import { useCloudflare } from '../context/CloudflareContext';
import { useTheme } from '../context/ThemeContext';
import { CatalogManagerView } from './CatalogManagerView';
import { CloudflareSettingsSection } from './CloudflareSettingsSection';
import { SeasonalInsightsDashboard } from './SeasonalInsightsDashboard';

interface SettingsViewProps {
  onOpenAddModal?: () => void;
  defaultSection?: 'general' | 'cloudflare' | 'catalog' | 'seasonal' | null;
  onBackToSettings?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ onOpenAddModal, defaultSection, onBackToSettings }) => {
  const { products, orders, purchaseOrders, clearAllData, storeName, storeLogo, categories, modelSkus, updateStoreProfile } = useInventory();
  const { uploadProductPhoto, syncToCloudflare, config } = useCloudflare();
  const { theme, toggleTheme, setTheme } = useTheme();
  const isLight = theme === 'light';
  const [activeSettingsSection, setActiveSettingsSection] = useState<'general' | 'cloudflare' | 'catalog' | 'seasonal' | null>(defaultSection ?? null);

  useEffect(() => {
    if (defaultSection !== undefined) {
      setActiveSettingsSection(defaultSection);
    }
  }, [defaultSection]);
  const [localStoreName, setLocalStoreName] = useState(storeName);
  const [localStoreLogo, setLocalStoreLogo] = useState(storeLogo);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [storePhone, setStorePhone] = useState('017 249 041');
  const [currency, setCurrency] = useState(() => {
    return localStorage.getItem('soletrack_currency') || 'USD ($)';
  });
  const [savedSuccess, setSavedSuccess] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLocalStoreName(storeName);
  }, [storeName]);

  useEffect(() => {
    setLocalStoreLogo(storeLogo);
  }, [storeLogo]);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file (PNG, JPG, WebP, SVG)');
      return;
    }

    setIsUploadingLogo(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      if (base64) {
        try {
          // Upload logo directly to Cloudflare R2 bucket (public CDN)
          const ext = file.name.split('.').pop() || 'jpg';
          const cleanName = `store_logo_${Date.now()}.${ext}`;
          const r2Url = await uploadProductPhoto(base64, cleanName);
          
          setLocalStoreLogo(r2Url);
          updateStoreProfile({ storeLogo: r2Url });
          
          // Persist store settings to Cloudflare D1 immediately
          await syncToCloudflare(products, orders, purchaseOrders, {
            storeName: localStoreName.trim(),
            storeLogo: r2Url,
            customCategories: categories,
            customSkus: modelSkus
          });

          setSavedSuccess(true);
          setTimeout(() => setSavedSuccess(false), 3000);
        } catch (err) {
          console.error('Failed uploading store logo to Cloudflare R2:', err);
          setLocalStoreLogo(base64);
          updateStoreProfile({ storeLogo: base64 });
        } finally {
          setIsUploadingLogo(false);
        }
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleResetLogo = async () => {
    setLocalStoreLogo(DEFAULT_STORE_LOGO);
    updateStoreProfile({ storeLogo: DEFAULT_STORE_LOGO });
    await syncToCloudflare(products, orders, purchaseOrders, {
      storeName: localStoreName.trim(),
      storeLogo: DEFAULT_STORE_LOGO,
      customCategories: categories,
      customSkus: modelSkus
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('soletrack_currency', currency);
    updateStoreProfile({
      storeName: localStoreName.trim(),
      storeLogo: localStoreLogo
    });
    
    await syncToCloudflare(products, orders, purchaseOrders, {
      storeName: localStoreName.trim(),
      storeLogo: localStoreLogo,
      customCategories: categories,
      customSkus: modelSkus
    });

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleExportData = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(products, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `store_inventory_backup_${new Date().toISOString().slice(0,10)}.json`);
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

  const settingsOptions = [
    {
      id: 'general' as const,
      title: 'General Store Preferences',
      badge: 'Identity & Theme',
      badgeColor: isLight ? 'bg-pink-100/70 text-pink-700 border-pink-300' : 'bg-pink-950/60 text-pink-300 border-pink-700/60',
      icon: <Store className="w-5 h-5 text-pink-500" />,
      iconBg: isLight ? 'bg-pink-50 text-pink-600 border border-pink-200/60' : 'bg-pink-500/10 text-pink-400 border border-pink-500/20'
    },
    {
      id: 'cloudflare' as const,
      title: 'Cloudflare Storage & D1',
      badge: 'Cloud Sync & Storage',
      badgeColor: isLight ? 'bg-sky-100/70 text-sky-700 border-sky-300' : 'bg-sky-950/60 text-sky-300 border-sky-700/60',
      icon: <Cloud className="w-5 h-5 text-sky-500" />,
      iconBg: isLight ? 'bg-sky-50 text-sky-600 border border-sky-200/60' : 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
    },
    {
      id: 'catalog' as const,
      title: 'Model SKU & Categories',
      badge: 'Catalog Registry',
      badgeColor: isLight ? 'bg-violet-100/70 text-violet-700 border-violet-300' : 'bg-violet-950/60 text-violet-300 border-violet-700/60',
      icon: <Layers className="w-5 h-5 text-violet-500" />,
      iconBg: isLight ? 'bg-violet-50 text-violet-600 border border-violet-200/60' : 'bg-violet-500/10 text-violet-400 border border-violet-500/20'
    },
    {
      id: 'seasonal' as const,
      title: 'Seasonal Insights',
      badge: 'Sales Forecast',
      badgeColor: isLight ? 'bg-emerald-100/70 text-emerald-700 border-emerald-300' : 'bg-emerald-950/60 text-emerald-300 border-emerald-700/60',
      icon: <TrendingUp className="w-5 h-5 text-emerald-500" />,
      iconBg: isLight ? 'bg-emerald-50 text-emerald-600 border border-emerald-200/60' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
    }
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* View 1: Main Settings Hub / Function List (when activeSettingsSection === null) */}
      {activeSettingsSection === null ? (
        <div className="space-y-6 animate-in fade-in-50 duration-200">
          {/* Main Settings Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-1">
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white font-['Plus_Jakarta_Sans'] tracking-tight">
                Store Settings & Control Center
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                Select a function below to manage your store profile, cloud integrations, catalog, or seasonal forecasts
              </p>
            </div>
            {savedSuccess && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 rounded-xl text-xs font-semibold animate-in fade-in shrink-0">
                <Check className="w-4 h-4" />
                <span>Store Profile & Settings Saved</span>
              </div>
            )}
          </div>

          {/* Settings Functions List: Click any item to open its dedicated page */}
          <div className="space-y-3.5">
            {settingsOptions.map((opt) => (
              <div
                key={opt.id}
                onClick={() => setActiveSettingsSection(opt.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setActiveSettingsSection(opt.id);
                  }
                }}
                className={`w-full p-4 sm:p-5 rounded-2xl border transition-all duration-200 cursor-pointer text-left group shadow-xs hover:shadow-md flex items-center justify-between gap-4 select-none ${
                  isLight 
                    ? 'bg-white hover:bg-slate-50/80 border-slate-200/90 hover:border-pink-300' 
                    : 'bg-slate-900/90 hover:bg-slate-900 border-slate-800 hover:border-pink-500/50'
                }`}
              >
                <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
                  <div className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shrink-0 border transition-transform duration-200 group-hover:scale-105 shadow-xs ${opt.iconBg}`}>
                    {opt.icon}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-sm sm:text-base font-bold font-['Plus_Jakarta_Sans'] text-slate-900 dark:text-white group-hover:text-pink-500 dark:group-hover:text-pink-400 transition-colors">
                        {opt.title}
                      </h2>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${opt.badgeColor}`}>
                        {opt.badge}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs font-semibold text-pink-500 dark:text-pink-400 hidden sm:inline opacity-0 group-hover:opacity-100 transition-opacity">
                    Open function
                  </span>
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                    isLight 
                      ? 'bg-slate-100 group-hover:bg-pink-500 group-hover:text-white text-slate-500' 
                      : 'bg-slate-800 group-hover:bg-pink-500 group-hover:text-white text-slate-400'
                  }`}>
                    <ChevronRight className="w-5 h-5 transition-transform group-hover:translate-x-0.5" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* View 2: Dedicated Sub-Page for Selected Settings Function */
        <div className="space-y-6 animate-in fade-in-50 duration-200">
          {/* Top Subpage Navigation Bar with Back Button */}
          <div className="flex flex-row items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setActiveSettingsSection(null);
                  onBackToSettings?.();
                }}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/80 shadow-xs hover:border-pink-500/40 group cursor-pointer shrink-0"
              >
                <ArrowLeft className="w-4 h-4 text-slate-400 group-hover:text-pink-500 transition-colors group-hover:-translate-x-1 transition-transform" />
                <span>Back to Settings</span>
              </button>

              {/* Breadcrumbs on Desktop (next to button) */}
              <div className="hidden lg:flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500">
                <button
                  type="button"
                  onClick={() => {
                    setActiveSettingsSection(null);
                    onBackToSettings?.();
                  }}
                  className="hover:text-pink-500 transition-colors cursor-pointer"
                >
                  Settings
                </button>
                <span>/</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {activeSettingsSection === 'general' && 'General Store Preferences'}
                  {activeSettingsSection === 'cloudflare' && 'Cloudflare Storage & D1'}
                  {activeSettingsSection === 'catalog' && 'Model SKU & Categories'}
                  {activeSettingsSection === 'seasonal' && 'Seasonal Insights'}
                </span>
              </div>
            </div>

            {/* Right Side Zone: Breadcrumbs on Tablet (sm to lg), Quick Section Switcher on Desktop (lg+) */}
            <div className="flex items-center gap-3">
              {/* Breadcrumbs on Tablet version (moved to the right side) */}
              <div className="hidden sm:flex lg:hidden items-center gap-1.5 text-xs sm:text-sm text-slate-400 dark:text-slate-500">
                <button
                  type="button"
                  onClick={() => {
                    setActiveSettingsSection(null);
                    onBackToSettings?.();
                  }}
                  className="hover:text-pink-500 transition-colors cursor-pointer"
                >
                  Settings
                </button>
                <span>/</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {activeSettingsSection === 'general' && 'General Store Preferences'}
                  {activeSettingsSection === 'cloudflare' && 'Cloudflare Storage & D1'}
                  {activeSettingsSection === 'catalog' && 'Model SKU & Categories'}
                  {activeSettingsSection === 'seasonal' && 'Seasonal Insights'}
                </span>
              </div>

              {/* Quick Section Switcher (Desktop only; hidden on Mobile and Tablet) */}
              <div className="hidden lg:flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl overflow-x-auto max-w-full no-scrollbar">
              {[
                { id: 'general', label: 'General', icon: <Store className="w-3.5 h-3.5" /> },
                { id: 'cloudflare', label: 'Cloudflare', icon: <Cloud className="w-3.5 h-3.5" /> },
                { id: 'catalog', label: 'Catalog SKU', icon: <Layers className="w-3.5 h-3.5" /> },
                { id: 'seasonal', label: 'Seasonal', icon: <TrendingUp className="w-3.5 h-3.5" /> },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveSettingsSection(tab.id as any)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 cursor-pointer ${
                    activeSettingsSection === tab.id
                      ? 'bg-white dark:bg-slate-900 text-pink-500 dark:text-pink-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

          {/* Subpage Content */}
          {activeSettingsSection === 'general' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center border shadow-xs ${
                    isLight ? 'bg-pink-50 text-pink-600 border-pink-200/60' : 'bg-pink-500/10 text-pink-400 border-pink-500/20'
                  }`}>
                    <Store className="w-5 h-5 text-pink-500" />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-bold font-['Plus_Jakarta_Sans'] text-slate-900 dark:text-white">
                      General Store Preferences
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Manage shop profile, branding logo, receipt currency, themes, and database backup
                    </p>
                  </div>
                </div>

                {savedSuccess && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 rounded-xl text-xs font-semibold animate-in fade-in shrink-0">
                    <Check className="w-4 h-4" />
                    <span>Store Profile & Settings Saved</span>
                  </div>
                )}
              </div>

              <form onSubmit={handleSaveSettings} className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: General & POS Settings */}
        <div className="md:col-span-2 space-y-6">
          
          {/* Store Profile & Logo Branding */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 space-y-5 shadow-sm dark:shadow-lg">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <Store className="w-4 h-4 text-pink-500 dark:text-pink-400" />
                <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Shop Identity & Logo</h2>
              </div>
              <span className="text-[11px] font-semibold text-pink-500 dark:text-pink-400 bg-pink-50 dark:bg-pink-500/10 px-2 py-0.5 rounded-lg border border-pink-200 dark:border-pink-500/20">
                Controls Top Bar Branding
              </span>
            </div>

            {/* Logo Upload & Preview Row */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
              <div className="relative group shrink-0">
                <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl overflow-hidden border-2 border-pink-500/30 bg-white dark:bg-slate-900 shadow-md flex items-center justify-center">
                  <img 
                    src={localStoreLogo} 
                    alt={localStoreName} 
                    className="w-full h-full object-cover" 
                  />
                </div>
              </div>

              <div className="flex-1 space-y-2">
                <div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white">Shop Brand Logo</h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Displayed in the top navigation bar, walk-in register, and print receipts.
                  </p>
                </div>

                <div className="flex items-center flex-wrap gap-2 pt-1">
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    disabled={isUploadingLogo}
                    onClick={() => logoInputRef.current?.click()}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-pink-500 hover:bg-pink-400 disabled:opacity-60 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
                  >
                    {isUploadingLogo ? (
                      <>
                        <RefreshCcw className="w-3.5 h-3.5 animate-spin" />
                        <span>Uploading to Cloudflare R2...</span>
                      </>
                    ) : (
                      <>
                        <Camera className="w-3.5 h-3.5" />
                        <span>Upload Logo to Cloudflare</span>
                      </>
                    )}
                  </button>

                  {localStoreLogo !== DEFAULT_STORE_LOGO && (
                    <button
                      type="button"
                      onClick={handleResetLogo}
                      className="flex items-center gap-1 px-2.5 py-1.5 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold transition-all cursor-pointer"
                      title="Reset to default store logo"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Reset</span>
                    </button>
                  )}
                </div>

                {/* Cloudflare R2 Bucket Upload Helper */}
                <div className="pt-2 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between gap-2 border-t border-slate-200/60 dark:border-slate-800/60 mt-2">
                  <div className="flex items-center gap-1.5 truncate">
                    <Cloud className="w-3.5 h-3.5 text-pink-500 shrink-0" />
                    <span className="truncate">
                      R2 Bucket: <strong className="text-slate-700 dark:text-slate-300 font-mono">laiza-store-images</strong>
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveSettingsSection('cloudflare')}
                    className="text-pink-500 hover:text-pink-600 font-semibold underline underline-offset-2 shrink-0 cursor-pointer text-[11px]"
                  >
                    Configure API Token →
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Shop Name (Shown on Bar)
                </label>
                <input
                  type="text"
                  value={localStoreName}
                  onChange={(e) => setLocalStoreName(e.target.value)}
                  placeholder="e.g. Laiza Store"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-pink-500 font-semibold transition-colors"
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

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Store Location / Address</label>
                <input
                  type="text"
                  defaultValue="Phnom Penh, Cambodia"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-pink-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Primary Currency</label>
                <select
                  value={currency}
                  onChange={(e) => {
                    setCurrency(e.target.value);
                    localStorage.setItem('soletrack_currency', e.target.value);
                  }}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-pink-500 cursor-pointer font-medium transition-colors"
                >
                  <option value="USD ($)">USD ($)</option>
                  <option value="KHR (៛)">KHR (៛)</option>
                  <option value="USD & KHR">USD & KHR Dual</option>
                </select>
              </div>
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
            </div>
          )}

          {/* Page 2: Cloudflare Storage & D1 */}
          {activeSettingsSection === 'cloudflare' && (
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center border shadow-xs ${
                  isLight ? 'bg-sky-50 text-sky-600 border-sky-200/60' : 'bg-sky-500/10 text-sky-400 border-sky-500/20'
                }`}>
                  <Cloud className="w-5 h-5 text-sky-500" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold font-['Plus_Jakarta_Sans'] text-slate-900 dark:text-white">
                    Cloudflare Storage & D1 Database
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Connect Cloudflare Workers, D1 SQL Database, and R2 image storage for real-time cloud sync
                  </p>
                </div>
              </div>
              <CloudflareSettingsSection />
            </div>
          )}

          {/* Page 3: Model SKU & Categories */}
          {activeSettingsSection === 'catalog' && (
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center border shadow-xs ${
                  isLight ? 'bg-violet-50 text-violet-600 border-violet-200/60' : 'bg-violet-500/10 text-violet-400 border-violet-500/20'
                }`}>
                  <Layers className="w-5 h-5 text-violet-500" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold font-['Plus_Jakarta_Sans'] text-slate-900 dark:text-white">
                    Model SKU & Categories Manager
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Manage registered footwear model codes (e.g. SHOE-01) and shoe categories
                  </p>
                </div>
              </div>
              <CatalogManagerView onOpenAddModal={onOpenAddModal || (() => {})} />
            </div>
          )}

          {/* Page 4: Seasonal Insights */}
          {activeSettingsSection === 'seasonal' && (
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center border shadow-xs ${
                  isLight ? 'bg-emerald-50 text-emerald-600 border-emerald-200/60' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                }`}>
                  <TrendingUp className="w-5 h-5 text-emerald-500" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold font-['Plus_Jakarta_Sans'] text-slate-900 dark:text-white">
                    Seasonal Insights & Demand Forecasting
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Quarterly footwear sales trends, size/color demand breakdown, weather analysis & forecasts
                  </p>
                </div>
              </div>
              <SeasonalInsightsDashboard />
            </div>
          )}
        </div>
      )}
    </div>
  );
};
