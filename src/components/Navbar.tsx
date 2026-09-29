import React from 'react';
import { 
  Package, 
  ShoppingBag, 
  ShoppingCart,
  Truck, 
  TrendingUp, 
  Menu,
  X,
  Settings
} from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { useCloudflare } from '../context/CloudflareContext';
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
  onOpenAddModal,
  onOpenLowStockDrawer,
  onOpenCart,
  onOpenCloudflareSync
}) => {
  const { lowStockItems, totalCartItems } = useInventory();
  const { isConfigured, d1Status } = useCloudflare();
  const { theme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const navItems: { id: ActiveTab; label: string; icon: React.ReactNode }[] = [
    { id: 'inventory', label: 'Inventory', icon: <Package className="w-4 h-4" /> },
    { id: 'pos', label: 'Walk-in Sell', icon: <ShoppingBag className="w-4 h-4" /> },
    { id: 'tracking', label: 'Order Tracking', icon: <Truck className="w-4 h-4" /> },
    { id: 'seasonal', label: 'Seasonal Insights', icon: <TrendingUp className="w-4 h-4" /> },
    { id: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4" /> }
  ];

  const isLight = theme === 'light';

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 w-full backdrop-blur-md border-b transition-colors shadow-sm ${
      isLight 
        ? 'bg-white/95 border-slate-200 text-slate-900 shadow-slate-200/50' 
        : 'bg-slate-950/95 border-slate-800/80 text-slate-100 shadow-md'
    }`}>
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-2">
        
        {/* Zone 1: Single text element wordmark */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <button 
            onClick={() => setActiveTab('inventory')}
            className="text-lg sm:text-xl font-bold tracking-tight flex items-center gap-2 group text-left shrink-0 cursor-pointer"
          >
            <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full overflow-hidden border shadow-md flex items-center justify-center transition-colors ${
              isLight ? 'border-pink-500/40 bg-slate-100 shadow-pink-500/10' : 'border-pink-500/30 bg-slate-900 shadow-pink-500/20'
            }`}>
              <img src="/src/assets/images/laiza_store_logo_1790350995561.jpg" alt="Laiza Store" className="w-full h-full object-cover" />
            </div>
            <span className={`font-['Plus_Jakarta_Sans'] font-extrabold text-base sm:text-lg transition-colors tracking-tight ${
              isLight 
                ? 'text-slate-900 group-hover:text-pink-600' 
                : 'text-slate-100 group-hover:text-pink-400'
            }`}>
              Laiza Store
            </span>
          </button>
        </div>

        {/* Zone 2: 4-6 clean text navigation links */}
        <nav className="hidden lg:flex items-center gap-1">
          {navItems.map(item => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                  isActive
                    ? isLight 
                      ? 'bg-pink-50 text-pink-600 border border-pink-200/80 shadow-xs' 
                      : 'bg-slate-800/90 text-pink-400 border border-slate-700/60 shadow-sm'
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

        {/* Right Action: Cart button & Mobile Menu Toggle */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {onOpenCart && (
            <button
              type="button"
              onClick={onOpenCart}
              className={`py-1.5 px-3 rounded-xl border text-xs font-semibold flex items-center gap-2 transition-all active:scale-95 shadow-xs cursor-pointer ${
                isLight
                  ? 'bg-slate-50 border-slate-200 text-slate-800 hover:border-pink-300 hover:bg-pink-50/50'
                  : 'bg-slate-900/90 border-slate-800 text-slate-200 hover:border-pink-400/50 hover:bg-slate-850'
              }`}
              title="View Cart"
            >
              <ShoppingCart className={`w-4 h-4 ${isLight ? 'text-pink-600' : 'text-pink-400'}`} />
              <span className="hidden sm:inline">Cart</span>
              {totalCartItems > 0 && (
                <span className="bg-pink-500 text-white text-[10px] font-black px-1.5 py-0.2 rounded-full font-mono">
                  {totalCartItems}
                </span>
              )}
            </button>
          )}

          {/* Mobile Menu Toggle (on mobile & tablet screens) */}
          <div className="lg:hidden">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`p-1.5 sm:p-2 rounded-lg transition-colors cursor-pointer ${
                isLight ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100' : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className={`lg:hidden border-t px-4 py-3 space-y-2 ${
          isLight ? 'border-slate-200 bg-white' : 'border-slate-800 bg-slate-950'
        }`}>
          {navItems.map(item => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full px-3 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-2.5 transition-colors text-left cursor-pointer ${
                  isActive
                    ? isLight ? 'bg-pink-50 text-pink-600 font-bold' : 'bg-slate-800 text-pink-400 font-bold'
                    : isLight ? 'text-slate-700 hover:bg-slate-100' : 'text-slate-300 hover:bg-slate-900'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            );
          })}

          {onOpenCart && (
            <button
              type="button"
              onClick={() => {
                onOpenCart();
                setMobileMenuOpen(false);
              }}
              className={`w-full px-3 py-2.5 rounded-lg text-xs font-semibold flex items-center justify-between border-t mt-1 pt-2 cursor-pointer ${
                isLight 
                  ? 'border-slate-100 text-slate-800 hover:bg-slate-50' 
                  : 'border-slate-900 text-slate-200 hover:bg-slate-900'
              }`}
            >
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-pink-500" />
                <span>View Cart & Checkout</span>
              </div>
              <span className="bg-pink-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full font-mono">
                {totalCartItems} pairs
              </span>
            </button>
          )}
        </div>
      )}
    </header>
  );
};
