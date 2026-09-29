import React, { useState, useEffect } from 'react';
import { InventoryProvider, useInventory } from './context/InventoryContext';
import { CloudflareProvider, useCloudflare } from './context/CloudflareContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { Navbar, ActiveTab } from './components/Navbar';
import { InventoryView } from './components/InventoryView';
import { PosView } from './components/PosView';
import { OrderTrackingDashboard } from './components/OrderTrackingDashboard';
import { SeasonalInsightsDashboard } from './components/SeasonalInsightsDashboard';
import { SettingsView } from './components/SettingsView';
import { LowStockDrawer } from './components/LowStockDrawer';
import { ProductDetailModal } from './components/ProductDetailModal';
import { SellModal } from './components/SellModal';
import { ReceiptModal } from './components/ReceiptModal';
import { AddProductModal } from './components/AddProductModal';
import { ShoeProduct, ShoeColor, SaleOrder } from './types';

const MainApp: React.FC = () => {
  const { products, orders, purchaseOrders } = useInventory();
  const { config, syncToCloudflare } = useCloudflare();
  const { theme } = useTheme();

  // Navigation & Modals State
  const [activeTab, setActiveTab] = useState<ActiveTab>('inventory');
  const [isLowStockDrawerOpen, setIsLowStockDrawerOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
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

  // Auto-sync to Cloudflare D1 Storage whenever products or orders change if autoSyncEnabled is true
  useEffect(() => {
    if (config.autoSyncEnabled && (products.length > 0 || orders.length > 0)) {
      const timer = setTimeout(() => {
        syncToCloudflare(products, orders, purchaseOrders);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [products, orders, purchaseOrders, config.autoSyncEnabled]);

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

  const isLight = theme === 'light';

  return (
    <div className={`min-h-screen flex flex-col font-['Plus_Jakarta_Sans'] antialiased w-full overflow-x-hidden transition-colors ${
      isLight ? 'bg-slate-50 text-slate-900' : 'bg-slate-950 text-slate-100'
    }`}>
      
      {/* Top Navigation Bar & Mobile/Tablet Down Bar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenAddModal={() => setIsAddModalOpen(true)}
        onOpenLowStockDrawer={() => setIsLowStockDrawerOpen(true)}
        onOpenCart={() => {
          setSellPreselectedProduct(null);
          setSellPreselectedSize(undefined);
          setSellPreselectedColor(undefined);
          setIsSellModalOpen(true);
        }}
      />

      {/* Main Content Area (pb-20 sm:pb-24 provides clearance above the tablet/mobile down bar) */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3.5 sm:px-6 lg:px-8 pt-18 sm:pt-20 pb-20 sm:pb-24 lg:pb-8 min-w-0">
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

        {activeTab === 'seasonal' && (
          <SettingsView 
            defaultSection="seasonal" 
            onOpenAddModal={() => setIsAddModalOpen(true)} 
            onBackToSettings={() => setActiveTab('settings')}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsView onOpenAddModal={() => setIsAddModalOpen(true)} />
        )}
      </main>

      {/* Modals and Drawers */}
      <LowStockDrawer
        isOpen={isLowStockDrawerOpen}
        onClose={() => setIsLowStockDrawerOpen(false)}
        onNavigateToPO={() => setActiveTab('inventory')}
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
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <CloudflareProvider>
        <InventoryProvider>
          <MainApp />
        </InventoryProvider>
      </CloudflareProvider>
    </ThemeProvider>
  );
}
