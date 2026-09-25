import React, { useState, useEffect } from 'react';
import { InventoryProvider, useInventory } from './context/InventoryContext';
import { GoogleAuthProviderComponent, useGoogleAuth } from './context/GoogleAuthContext';
import { Navbar, ActiveTab } from './components/Navbar';
import { InventoryView } from './components/InventoryView';
import { PosView } from './components/PosView';
import { OrderTrackingDashboard } from './components/OrderTrackingDashboard';
import { PurchaseOrdersView } from './components/PurchaseOrdersView';
import { SeasonalInsightsDashboard } from './components/SeasonalInsightsDashboard';
import { LowStockDrawer } from './components/LowStockDrawer';
import { ProductDetailModal } from './components/ProductDetailModal';
import { SellModal } from './components/SellModal';
import { ReceiptModal } from './components/ReceiptModal';
import { AddProductModal } from './components/AddProductModal';
import { GoogleSyncModal } from './components/GoogleSyncModal';
import { ShoeProduct, ShoeColor, SaleOrder } from './types';
import { AlertTriangle, Sparkles, RefreshCw, Cloud, Table, ExternalLink } from 'lucide-react';

const MainApp: React.FC = () => {
  const { products, orders, purchaseOrders, lowStockItems, resetDemoData, restoreAllData } = useInventory();
  const { user, spreadsheetUrl, driveFolderUrl, syncDataFromGoogle, syncDataToGoogle } = useGoogleAuth();

  // Navigation & Modals State
  const [activeTab, setActiveTab] = useState<ActiveTab>('inventory');
  const [isLowStockDrawerOpen, setIsLowStockDrawerOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isGoogleSyncModalOpen, setIsGoogleSyncModalOpen] = useState(false);
  
  // Selected product ID for detail inspection (PDP)
  const [detailProductId, setDetailProductId] = useState<string | null>(null);
  const detailProduct = products.find(p => p.id === detailProductId) || null;
  
  // Sell Modal State
  const [isSellModalOpen, setIsSellModalOpen] = useState(false);
  const [sellPreselectedProduct, setSellPreselectedProduct] = useState<ShoeProduct | null>(null);
  const [sellPreselectedSize, setSellPreselectedSize] = useState<number | undefined>(undefined);
  const [sellPreselectedColor, setSellPreselectedColor] = useState<ShoeColor | undefined>(undefined);

  // Receipt Modal State
  const [receiptOrder, setReceiptOrder] = useState<SaleOrder | null>(null);
  const [trackingSearchQuery, setTrackingSearchQuery] = useState<string>('');

  // Auto-restore data from Google Sheets when user is signed in and local state is empty
  useEffect(() => {
    if (user && products.length === 0) {
      syncDataFromGoogle().then(loaded => {
        if (loaded && loaded.products && loaded.products.length > 0) {
          restoreAllData(loaded);
        }
      });
    }
  }, [user]);

  // Auto-sync to Google Sheets whenever products or orders change and user is signed in
  useEffect(() => {
    if (user && (products.length > 0 || orders.length > 0)) {
      const timer = setTimeout(() => {
        syncDataToGoogle(products, orders, purchaseOrders);
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [products, orders, purchaseOrders, user]);

  const handleOpenProductDetail = (product: ShoeProduct) => {
    setDetailProductId(product.id);
  };

  const handleOpenSellModal = (product?: ShoeProduct, size?: number, color?: ShoeColor) => {
    setSellPreselectedProduct(product || null);
    setSellPreselectedSize(size);
    setSellPreselectedColor(color);
    setIsSellModalOpen(true);
  };

  const handleSaleSuccess = (createdOrder: SaleOrder) => {
    setReceiptOrder(createdOrder);
  };

  const handleNavigateToTracking = (orderNumber: string) => {
    setTrackingSearchQuery(orderNumber);
    setActiveTab('tracking');
  };

  const handleNavigateToPO = () => {
    setActiveTab('purchase_orders');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-['Plus_Jakarta_Sans'] antialiased w-full overflow-x-hidden">
      
      {/* Top Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenAddModal={() => setIsAddModalOpen(true)}
        onOpenLowStockDrawer={() => setIsLowStockDrawerOpen(true)}
        onOpenGoogleSync={() => setIsGoogleSyncModalOpen(true)}
        onOpenCart={() => {
          setSellPreselectedProduct(null);
          setSellPreselectedSize(undefined);
          setSellPreselectedColor(undefined);
          setIsSellModalOpen(true);
        }}
      />

      {/* Cloud Sync Status Banner when Google is Connected */}
      {user && spreadsheetUrl && (
        <div className="bg-slate-900/90 border-b border-emerald-500/20 px-4 py-2 flex items-center justify-between text-xs max-w-7xl mx-auto w-full mt-14 sm:mt-16">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-emerald-400 font-semibold">Google Sheets & Drive Connected:</span>
            <span className="text-slate-300 hidden sm:inline">All shoe data, pictures, and sales are automatically backed up</span>
          </div>
          <div className="flex items-center gap-3">
            <a
              href={spreadsheetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1 hover:underline text-[11px]"
            >
              <Table className="w-3.5 h-3.5" />
              <span>Open Google Sheet</span>
              <ExternalLink className="w-2.5 h-2.5" />
            </a>
            {driveFolderUrl && (
              <a
                href={driveFolderUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1 hover:underline text-[11px] hidden sm:flex"
              >
                <Cloud className="w-3.5 h-3.5" />
                <span>Drive Photos Folder</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            )}
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className={`flex-1 max-w-7xl w-full mx-auto px-3.5 sm:px-6 lg:px-8 pb-4 sm:pb-8 min-w-0 ${user && spreadsheetUrl ? 'pt-4' : 'pt-18 sm:pt-20'}`}>
        {activeTab === 'inventory' && (
          <InventoryView
            onOpenProductDetail={handleOpenProductDetail}
            onOpenSellModal={handleOpenSellModal}
            onOpenCart={handleOpenSellModal}
            onOpenAddModal={() => setIsAddModalOpen(true)}
          />
        )}

        {activeTab === 'pos' && (
          <PosView
            onOpenReceiptModal={(order) => setReceiptOrder(order)}
          />
        )}

        {activeTab === 'tracking' && (
          <OrderTrackingDashboard
            initialSearchQuery={trackingSearchQuery}
            onOpenReceiptModal={(order) => setReceiptOrder(order)}
          />
        )}

        {activeTab === 'purchase_orders' && (
          <PurchaseOrdersView />
        )}

        {activeTab === 'seasonal' && (
          <SeasonalInsightsDashboard />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 px-4 sm:px-8 text-center text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-4 max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-300 font-['Syne']">SoleTrack</span>
          <span>· Real-time Footwear Inventory, POS & Delivery Intelligence</span>
        </div>
        <div className="flex items-center gap-4 text-[11px]">
          <button
            type="button"
            onClick={() => {
              if (window.confirm('Clear all catalog, order, and cart records?')) {
                resetDemoData();
              }
            }}
            className="text-slate-500 hover:text-slate-300 flex items-center gap-1 hover:underline"
          >
            <RefreshCw className="w-3 h-3" /> Clear All Data
          </button>
          <span>Phnom Penh & Provinces Direct</span>
        </div>
      </footer>

      {/* Modals and Drawers */}
      <LowStockDrawer
        isOpen={isLowStockDrawerOpen}
        onClose={() => setIsLowStockDrawerOpen(false)}
        onNavigateToPO={handleNavigateToPO}
      />

      <ProductDetailModal
        product={detailProduct}
        isOpen={!!detailProduct}
        onClose={() => setDetailProductId(null)}
        onOpenSellModal={handleOpenSellModal}
      />

      <SellModal
        isOpen={isSellModalOpen}
        onClose={() => {
          setIsSellModalOpen(false);
          setSellPreselectedProduct(null);
        }}
        preSelectedProduct={sellPreselectedProduct}
        preSelectedSize={sellPreselectedSize}
        preSelectedColor={sellPreselectedColor}
        onSaleSuccess={handleSaleSuccess}
      />

      <ReceiptModal
        order={receiptOrder}
        isOpen={!!receiptOrder}
        onClose={() => setReceiptOrder(null)}
        onNavigateToTracking={handleNavigateToTracking}
      />

      <AddProductModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />

      <GoogleSyncModal
        isOpen={isGoogleSyncModalOpen}
        onClose={() => setIsGoogleSyncModalOpen(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <GoogleAuthProviderComponent>
      <InventoryProvider>
        <MainApp />
      </InventoryProvider>
    </GoogleAuthProviderComponent>
  );
}
