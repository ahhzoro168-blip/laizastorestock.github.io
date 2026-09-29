import React from 'react';
import { 
  Package, 
  ShoppingBag, 
  Truck, 
  TrendingUp, 
  Settings, 
  ChevronDown,
  X
} from 'lucide-react';
import { ActiveTab } from './Navbar';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  mobileOpen = false,
  onCloseMobile
}) => {
  const [productMenuOpen, setProductMenuOpen] = React.useState(true);

  const mainNav = [
    { id: 'inventory' as ActiveTab, label: 'Product & Stock', icon: <Package className="w-4 h-4" /> },
    { id: 'pos' as ActiveTab, label: 'Walk-in Sell (POS)', icon: <ShoppingBag className="w-4 h-4" /> },
    { id: 'tracking' as ActiveTab, label: 'Order Tracking', icon: <Truck className="w-4 h-4" /> },
    { id: 'seasonal' as ActiveTab, label: 'Seasonal Insights', icon: <TrendingUp className="w-4 h-4" /> },
    { id: 'settings' as ActiveTab, label: 'Settings', icon: <Settings className="w-4 h-4" /> },
  ];

  const content = (
    <div className="w-64 bg-white border-r border-gray-200/80 flex flex-col justify-between h-full p-5 min-h-screen shrink-0 font-['Plus_Jakarta_Sans'] text-slate-800">
      
      {/* Top Brand Logo & Navigation */}
      <div className="space-y-6">
        
        {/* Brand Header */}
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl overflow-hidden border border-indigo-100 shadow-sm bg-indigo-50 flex items-center justify-center shrink-0">
              <img 
                src="/src/assets/images/laiza_store_logo_1790350995561.jpg" 
                alt="Laiza Store" 
                className="w-full h-full object-cover" 
              />
            </div>
            <div>
              <h1 className="text-base font-extrabold text-slate-900 tracking-tight font-['Syne'] uppercase">
                LAIZA STORE
              </h1>
              <p className="text-[10px] text-slate-400 font-medium tracking-wider">FOOTWEAR SAAS</p>
            </div>
          </div>

          {onCloseMobile && (
            <button 
              onClick={onCloseMobile} 
              className="lg:hidden p-1 text-slate-400 hover:text-slate-600 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Navigation Items */}
        <nav className="space-y-1.5 pt-2">
          
          {/* Product Nav Item with Submenu */}
          <div>
            <button
              onClick={() => {
                setActiveTab('inventory');
                setProductMenuOpen(!productMenuOpen);
              }}
              className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
                activeTab === 'inventory' || activeTab === 'categories'
                  ? 'bg-[#635BFF] text-white shadow-md shadow-indigo-500/20'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Package className="w-4 h-4" />
                <span>Product</span>
              </div>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${productMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Submenu Tree */}
            {productMenuOpen && (
              <div className="ml-5 pl-3 border-l border-gray-200/80 my-1.5 space-y-1 text-xs">
                <button
                  onClick={() => {
                    setActiveTab('inventory');
                    if (onCloseMobile) onCloseMobile();
                  }}
                  className={`w-full text-left py-1.5 px-3 rounded-lg text-[11px] font-medium transition-colors cursor-pointer ${
                    activeTab === 'inventory' 
                      ? 'bg-[#635BFF]/10 text-[#635BFF] font-bold' 
                      : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                  }`}
                >
                  List View
                </button>
                <button
                  onClick={() => {
                    setActiveTab('categories');
                    if (onCloseMobile) onCloseMobile();
                  }}
                  className={`w-full text-left py-1.5 px-3 rounded-lg text-[11px] font-medium transition-colors cursor-pointer ${
                    activeTab === 'categories'
                      ? 'bg-[#635BFF]/10 text-[#635BFF] font-bold'
                      : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                  }`}
                >
                  Category List
                </button>
              </div>
            )}
          </div>

          {/* Other Main Nav Items */}
          {mainNav.slice(1).map(item => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  if (onCloseMobile) onCloseMobile();
                }}
                className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#635BFF] text-white shadow-md shadow-indigo-500/20'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            );
          })}

        </nav>
      </div>

    </div>
  );

  return (
    <>
      {/* Desktop Fixed Sidebar */}
      <aside className="hidden lg:block fixed top-0 left-0 bottom-0 z-40 w-64">
        {content}
      </aside>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onCloseMobile} />
          <div className="relative z-10 w-64 max-w-[80vw]">
            {content}
          </div>
        </div>
      )}
    </>
  );
};
