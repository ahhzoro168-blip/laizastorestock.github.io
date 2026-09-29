import React from 'react';
import { 
  Search, 
  Bell, 
  ShoppingCart, 
  ChevronDown, 
  Menu,
  ChevronRight
} from 'lucide-react';
import { ActiveTab } from './Navbar';
import { useInventory } from '../context/InventoryContext';

interface HeaderProps {
  activeTab: ActiveTab;
  onOpenMobileSidebar: () => void;
  onOpenCart?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onOpenMobileSidebar,
  onOpenCart
}) => {
  const { totalCartItems } = useInventory();

  // Dynamic Page Title
  const getPageTitle = () => {
    switch (activeTab) {
      case 'inventory': return 'Product';
      case 'categories': return 'Category List';
      case 'pos': return 'Walk-in Sell (POS)';
      case 'tracking': return 'Order Tracking & Delivery';
      case 'seasonal': return 'Seasonal Insights';
      case 'settings': return 'Settings & Cloudflare';
      default: return 'Product';
    }
  };

  const formattedDate = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  });

  return (
    <header className="lg:pl-64 sticky top-0 z-30 w-full bg-[#F8F9FB]/90 backdrop-blur-md px-4 sm:px-8 py-4 border-b border-gray-200/60 flex items-center justify-between gap-4 font-['Plus_Jakarta_Sans']">
      
      {/* Mobile Toggle & Page Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileSidebar}
          className="lg:hidden p-2 rounded-xl bg-white border border-gray-200 text-slate-600 hover:text-slate-900 shadow-sm"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight font-['Syne']">
            {getPageTitle()}
          </h1>
          <p className="text-xs text-slate-400 font-medium">
            {formattedDate}
          </p>
        </div>
      </div>

      {/* Right Top Bar Area */}
      <div className="flex items-center gap-3 sm:gap-5">
        
        {/* Breadcrumbs */}
        <div className="hidden xl:flex items-center gap-1.5 text-xs text-slate-400 font-medium">
          <span>Product</span>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className={activeTab === 'categories' ? 'text-slate-800 font-bold' : ''}>Category list</span>
          {activeTab !== 'categories' && (
            <>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className="text-slate-800 font-bold">List view</span>
            </>
          )}
        </div>

        {/* Quick Search Icon */}
        <button className="w-9 h-9 rounded-full bg-white border border-gray-200/80 hover:bg-gray-50 flex items-center justify-center text-slate-500 shadow-sm transition-colors cursor-pointer">
          <Search className="w-4 h-4" />
        </button>

        {/* Cart Icon Button */}
        {onOpenCart && (
          <button
            onClick={onOpenCart}
            className="w-9 h-9 rounded-full bg-white border border-gray-200/80 hover:bg-gray-50 flex items-center justify-center text-slate-600 shadow-sm transition-colors relative cursor-pointer"
            title="View Cart"
          >
            <ShoppingCart className="w-4 h-4" />
            {totalCartItems > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#635BFF] text-white text-[9px] font-black flex items-center justify-center">
                {totalCartItems}
              </span>
            )}
          </button>
        )}

        {/* Notifications Bell */}
        <button className="w-9 h-9 rounded-full bg-white border border-gray-200/80 hover:bg-gray-50 flex items-center justify-center text-slate-500 shadow-sm transition-colors relative cursor-pointer">
          <Bell className="w-4 h-4" />
          <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-rose-500" />
        </button>

        {/* User Profile Badge */}
        <div className="flex items-center gap-2.5 pl-2 border-l border-gray-200">
          <div className="w-9 h-9 rounded-full overflow-hidden border border-indigo-200 bg-indigo-50 shrink-0">
            <img 
              src="/src/assets/images/laiza_store_logo_1790350995561.jpg" 
              alt="Laiza Admin" 
              className="w-full h-full object-cover" 
            />
          </div>
          <div className="hidden sm:block text-left">
            <h4 className="text-xs font-bold text-slate-900 leading-tight">Laiza Admin</h4>
            <p className="text-[10px] text-slate-400 font-mono">ID: 017249</p>
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
        </div>

      </div>

    </header>
  );
};
