import React from 'react';
import { 
  Package, 
  ShoppingBag, 
  ShoppingCart,
  Truck, 
  TrendingUp, 
  Settings,
  AlertTriangle
} from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { useTheme } from '../context/ThemeContext';

export type ActiveTab = 'inventory' | 'pos' | 'tracking' | 'purchase_orders' | 'seasonal' | 'settings';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenAddModal?: () => void;
  onOpenLowStockDrawer?: () => void;
  onOpenCart?: () => void;
  onOpenCloudflareSync?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenLowStockDrawer,
  onOpenCart
}) => {
  const { lowStockItems, totalCartItems, storeName, storeLogo } = useInventory();
  const { theme } = useTheme();

  const navItems: { id: ActiveTab; label: string; shortLabel: string; icon: React.ReactNode }[] = [
    { id: 'inventory', label: 'Inventory', shortLabel: 'Inventory', icon: <Package className="w-5 h-5 sm:w-5 sm:h-5" /> },
    { id: 'pos', label: 'Walk-in Sell', shortLabel: 'Walk-in', icon: <ShoppingBag className="w-5 h-5 sm:w-5 sm:h-5" /> },
    { id: 'tracking', label: 'Order Tracking', shortLabel: 'Tracking', icon: <Truck className="w-5 h-5 sm:w-5 sm:h-5" /> },
    { id: 'settings', label: 'Settings', shortLabel: 'Settings', icon: <Settings className="w-5 h-5 sm:w-5 sm:h-5" /> }
  ];

  const isLight = theme === 'light';

  return (
    <>
      {/* ============================================================ */}
      {/* Top Header: Shop Branding (Display only; managed in Settings)*/}
      {/* and Desktop Navigation Links                                  */}
      {/* ============================================================ */}
      <header className={`fixed top-0 left-0 right-0 z-40 w-full backdrop-blur-md border-b transition-colors shadow-sm ${
        isLight 
          ? 'bg-white/95 border-slate-200 text-slate-900 shadow-slate-200/50' 
          : 'bg-slate-950/95 border-slate-800/80 text-slate-100 shadow-md'
      }`}>
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-3">
          
          {/* Shop Logo & Name Branding Section (Non-editable, controlled via Settings) */}
          <button
            type="button"
            onClick={() => setActiveTab('inventory')}
            className="flex items-center gap-2 sm:gap-2.5 min-w-0 text-left cursor-pointer group focus:outline-none"
            title={`${storeName} · View Inventory`}
            aria-label={`${storeName} - Click to view inventory`}
          >
            {/* Shop Logo Avatar */}
            <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full overflow-hidden border shadow-sm flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${
              isLight 
                ? 'border-pink-500/40 bg-slate-100 shadow-pink-500/10' 
                : 'border-pink-500/30 bg-slate-900 shadow-pink-500/20'
            }`}>
              <img src={storeLogo} alt={storeName} className="w-full h-full object-cover" />
            </div>

            {/* Shop Name */}
            <span className={`font-['Plus_Jakarta_Sans'] font-extrabold text-base sm:text-lg transition-colors tracking-tight truncate block ${
              isLight 
                ? 'text-slate-900 group-hover:text-pink-600' 
                : 'text-slate-100 group-hover:text-pink-400'
            }`}>
              {storeName}
            </span>
          </button>

          {/* Desktop Navigation Links (Hidden on Tablet & Mobile) */}
          <nav className="hidden lg:flex items-center gap-1.5">
            {navItems.map(item => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                    isActive
                      ? isLight 
                        ? 'bg-pink-50 text-pink-600 border border-pink-200/80 shadow-xs font-bold' 
                        : 'bg-slate-800/90 text-pink-400 border border-slate-700/60 shadow-sm font-bold'
                      : isLight
                        ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Header Zone: Low Stock indicator & Cart Icon Button */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {lowStockItems.length > 0 && onOpenLowStockDrawer && (
              <button
                type="button"
                onClick={onOpenLowStockDrawer}
                className="px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 transition-all cursor-pointer"
                title={`${lowStockItems.length} low stock items`}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span className="hidden sm:inline font-mono">{lowStockItems.length} Low Stock</span>
                <span className="sm:hidden font-mono">{lowStockItems.length}</span>
              </button>
            )}

            {/* Cart Icon in top bar */}
            {onOpenCart && (
              <button
                type="button"
                onClick={onOpenCart}
                className={`relative py-1.5 px-2.5 sm:px-3 rounded-xl border text-xs font-bold flex items-center gap-1.5 sm:gap-2 transition-all active:scale-95 shadow-xs cursor-pointer ${
                  isLight
                    ? 'bg-slate-50 border-slate-200 text-slate-800 hover:border-pink-300 hover:bg-pink-50/50'
                    : 'bg-slate-900 border-slate-800 text-slate-200 hover:border-pink-400/50 hover:bg-slate-850'
                }`}
                title="View Cart"
                aria-label="View Shopping Cart"
              >
                <ShoppingCart className={`w-4 h-4 ${isLight ? 'text-pink-600' : 'text-pink-400'}`} />
                <span className="hidden sm:inline font-semibold">Cart</span>
                {totalCartItems > 0 && (
                  <span className="bg-pink-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full font-mono leading-none min-w-[18px] text-center">
                    {totalCartItems}
                  </span>
                )}
              </button>
            )}
          </div>

        </div>
      </header>

      {/* ============================================================ */}
      {/* Down Bar for Tablet & Mobile Version                          */}
      {/* Fixed at bottom of screen with high-accessibility tab buttons */}
      {/* ============================================================ */}
      <nav 
        aria-label="Tablet and Mobile Navigation" 
        className={`fixed bottom-0 left-0 right-0 z-50 lg:hidden border-t backdrop-blur-md transition-colors ${
          isLight 
            ? 'bg-white/95 border-slate-200/90 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]' 
            : 'bg-slate-950/95 border-slate-800/90 shadow-[0_-4px_25px_rgba(0,0,0,0.4)]'
        }`}
        style={{ paddingBottom: 'max(0.375rem, env(safe-area-inset-bottom, 0px))' }}
      >
        <div className="max-w-md md:max-w-xl mx-auto px-1.5 sm:px-4 py-1 grid grid-cols-4 gap-1.5 sm:gap-2">
          {navItems.map(item => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`flex flex-col items-center justify-center py-1 sm:py-1.5 px-0.5 rounded-xl transition-all cursor-pointer select-none active:scale-95 group ${
                  isActive
                    ? isLight
                      ? 'text-pink-600'
                      : 'text-pink-400'
                    : isLight
                      ? 'text-slate-500 hover:text-slate-800'
                      : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className={`p-1 sm:p-1.5 rounded-xl transition-all ${
                  isActive 
                    ? isLight 
                      ? 'bg-pink-100/70 text-pink-600 scale-105' 
                      : 'bg-pink-950/60 text-pink-400 scale-105' 
                    : 'group-hover:bg-slate-100 dark:group-hover:bg-slate-900'
                }`}>
                  {item.icon}
                </div>
                <span className={`text-[10px] sm:text-xs leading-none mt-1 tracking-tight truncate max-w-full ${
                  isActive ? 'font-bold' : 'font-medium'
                }`}>
                  <span className="sm:hidden">{item.shortLabel}</span>
                  <span className="hidden sm:inline">{item.label}</span>
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};
