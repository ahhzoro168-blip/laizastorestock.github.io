import React from 'react';
import { 
  Package, 
  ShoppingBag, 
  ShoppingCart,
  Truck, 
  FileText, 
  TrendingUp, 
  Menu,
  X,
  Cloud,
  CheckCircle2,
  RefreshCw,
  Settings,
  Layers
} from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { useGoogleAuth } from '../context/GoogleAuthContext';

export type ActiveTab = 'inventory' | 'pos' | 'tracking' | 'purchase_orders' | 'seasonal' | 'settings';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenAddModal?: () => void;
  onOpenLowStockDrawer?: () => void;
  onOpenCart?: () => void;
  onOpenGoogleSync?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenAddModal,
  onOpenLowStockDrawer,
  onOpenCart,
  onOpenGoogleSync
}) => {
  const { lowStockItems, totalCartItems } = useInventory();
  const { user, syncStatus, isSyncing, lastSyncTime } = useGoogleAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const navItems: { id: ActiveTab; label: string; icon: React.ReactNode }[] = [
    { id: 'inventory', label: 'Inventory', icon: <Package className="w-4 h-4" /> },
    { id: 'pos', label: 'Walk-in Sell', icon: <ShoppingBag className="w-4 h-4" /> },
    { id: 'tracking', label: 'Order Tracking', icon: <Truck className="w-4 h-4" /> },
    { id: 'seasonal', label: 'Seasonal Insights', icon: <TrendingUp className="w-4 h-4" /> },
    { id: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4" /> }
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 w-full bg-slate-950/95 backdrop-blur-md border-b border-slate-800/80 shadow-md">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-2">
        
        {/* Zone 1: Single text element wordmark */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <button 
            onClick={() => setActiveTab('inventory')}
            className="text-lg sm:text-xl font-bold tracking-tight text-white flex items-center gap-2 group text-left shrink-0"
          >
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full overflow-hidden border border-amber-500/30 bg-slate-900 shadow-md shadow-amber-500/20 flex items-center justify-center">
              <img src="/src/assets/images/laiza_store_logo_1790350995561.jpg" alt="Laiza Store" className="w-full h-full object-cover" />
            </div>
            <span className="font-['Syne'] font-extrabold text-base sm:text-lg text-slate-100 group-hover:text-amber-400 transition-colors">
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
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
                  isActive
                    ? 'bg-slate-800/90 text-amber-400 border border-slate-700/60 shadow-sm'
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
        <div className="flex items-center gap-2 shrink-0">
          {/* Multi-Device Live Sync Indicator */}
          <div 
            className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-900 border border-emerald-500/30 text-emerald-400 text-[11px] font-semibold"
            title="Real-time multi-device sync active across PC, Phone, iPad, and Web"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>All Devices Synced</span>
          </div>

          {/* Desktop Drive & Sheets Menu Button */}
          {onOpenGoogleSync && (
            <button
              type="button"
              onClick={onOpenGoogleSync}
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 transition-all active:scale-95"
              title="Google Drive & Sheets Cloud Backup"
            >
              <Cloud className="w-3.5 h-3.5 text-amber-400" />
              <span>Drive & Sheets</span>
              {user && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              )}
            </button>
          )}

          {onOpenCart && (
            <button
              type="button"
              onClick={onOpenCart}
              className="py-1.5 px-3 rounded-xl border border-slate-800 bg-slate-900/90 hover:border-amber-400/50 hover:bg-slate-850 text-slate-200 text-xs font-semibold flex items-center gap-2 transition-all active:scale-95 shadow-sm"
              title="View Cart"
            >
              <ShoppingCart className="w-4 h-4 text-amber-400" />
              <span className="hidden sm:inline">Cart</span>
              {totalCartItems > 0 && (
                <span className="bg-amber-500 text-slate-950 text-[10px] font-black px-1.5 py-0.2 rounded-full font-mono">
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
              className="p-1.5 sm:p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-900 transition-colors"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-800 bg-slate-950 px-4 py-3 space-y-2">
          {navItems.map(item => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full px-3 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-2.5 transition-colors text-left ${
                  isActive
                    ? 'bg-slate-800 text-amber-400 font-bold'
                    : 'text-slate-300 hover:bg-slate-900'
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
              className="w-full px-3 py-2.5 rounded-lg text-xs font-semibold flex items-center justify-between text-slate-200 hover:bg-slate-900 border-t border-slate-900 mt-1 pt-2"
            >
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-amber-400" />
                <span>View Cart & Checkout</span>
              </div>
              <span className="bg-amber-500 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full font-mono">
                {totalCartItems} pairs
              </span>
            </button>
          )}

          {/* Google Drive & Google Sheets Option in Menu */}
          {onOpenGoogleSync && (
            <div className="pt-2 border-t border-slate-800/80 mt-2">
              <div className="p-3 bg-slate-900/90 rounded-2xl border border-slate-800 space-y-2">
                <div className="flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Cloud className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <p className="text-xs font-bold text-white truncate">
                        Google Drive & Google Sheets
                      </p>
                      {user ? (
                        <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 shrink-0">
                          Connected
                        </span>
                      ) : (
                        <span className="text-[10px] text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20 shrink-0">
                          Backup
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 leading-tight mt-0.5">
                      {user
                        ? `Connected as ${user.email}`
                        : "Click below to create your cloud files"
                      }
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenGoogleSync();
                  }}
                  className="w-full py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-bold rounded-xl flex items-center justify-center gap-2 border border-slate-700 transition-all active:scale-95 shadow-sm"
                >
                  <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                  </svg>
                  <span>
                    {user ? 'Manage Drive & Sheets Backup' : 'Google Drive & Sheets: Create Cloud Files'}
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </header>
  );
};
