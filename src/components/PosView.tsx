import React, { useState } from 'react';
import { 
  ShoppingBag, 
  ShoppingCart,
  MapPin, 
  CreditCard, 
  Search, 
  DollarSign, 
  CheckCircle2, 
  QrCode, 
  Building2,
  Trash2,
  Printer,
  History,
  Plus,
  Minus,
  Check,
  Globe,
  Send,
  Video,
  X
} from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { ShoeProduct, ShoeColor, LocationType, OrderPlatform, SaleOrder } from '../types';
import { CAMBODIA_PROVINCES, PHNOM_PENH_DISTRICTS } from '../data/mockData';

interface PosViewProps {
  onOpenReceiptModal: (order: SaleOrder) => void;
}

export const PosView: React.FC<PosViewProps> = ({ onOpenReceiptModal }) => {
  const { 
    products, 
    cart, 
    addToCart, 
    removeFromCart, 
    updateCartQuantity, 
    clearCart, 
    totalCartItems, 
    totalCartAmount, 
    totalCartProfit, 
    recordMultiSale 
  } = useInventory();

  // POS Selector State for adding products to cart
  const [selectedProduct, setSelectedProduct] = useState<ShoeProduct | null>(products[0] || null);
  const [selectedSize, setSelectedSize] = useState<number>(40);
  const [selectedColor, setSelectedColor] = useState<ShoeColor>('ខ្មៅ');
  const [quantity, setQuantity] = useState<number>(1);
  const [catalogSearch, setCatalogSearch] = useState('');
  const [addFeedback, setAddFeedback] = useState(false);

  // Customer & Location - clean fields for production use
  const [orderPlatform, setOrderPlatform] = useState<OrderPlatform>('Page');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [ownerPhone, setOwnerPhone] = useState('');
  const [locationType, setLocationType] = useState<LocationType>('Phnom Penh');
  const [district, setDistrict] = useState<string>(PHNOM_PENH_DISTRICTS[0]);
  const [provinceName, setProvinceName] = useState<string>(CAMBODIA_PROVINCES[0]);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  
  // Payment
  const [paymentMethod, setPaymentMethod] = useState<string>('Bank Transfer');
  const [paymentStatus, setPaymentStatus] = useState<'Paid' | 'Pending' | 'COD - Due on Arrival'>('Paid');
  const [lastCompletedOrder, setLastCompletedOrder] = useState<SaleOrder | null>(null);

  // Filter Catalog
  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(catalogSearch.toLowerCase()) ||
    p.sku.toLowerCase().includes(catalogSearch.toLowerCase())
  );

  const activeProduct = selectedProduct || products[0];

  const availableSizes = activeProduct 
    ? Array.from(new Set(activeProduct.variants.map(v => v.size))).sort((a, b) => a - b)
    : [];
  
  const availableColors = activeProduct
    ? Array.from(new Set(activeProduct.variants.map(v => v.color))) as ShoeColor[]
    : [];

  const currentVariant = activeProduct?.variants.find(
    v => v.size === selectedSize && v.color === selectedColor
  );
  const currentStock = currentVariant ? currentVariant.stock : 0;

  const handleProductSelect = (p: ShoeProduct) => {
    setSelectedProduct(p);
    if (p.variants.length > 0) {
      setSelectedSize(p.variants[0].size);
      setSelectedColor(p.variants[0].color);
      setQuantity(1);
    }
  };

  const handleAddCurrentToCart = () => {
    if (!activeProduct) return;
    const res = addToCart(activeProduct, selectedSize, selectedColor, quantity);
    if (res.success) {
      setAddFeedback(true);
      setTimeout(() => setAddFeedback(false), 1200);
    } else if (res.message) {
      alert(res.message);
    }
  };

  const handleLocationChange = (loc: LocationType) => {
    setLocationType(loc);
    setPaymentMethod('Bank Transfer');
    setPaymentStatus('Paid');
    if (loc === 'Phnom Penh') {
      setDeliveryAddress('Phnom Penh Store Counter');
    } else {
      setDeliveryAddress('Provincial Delivery Station');
    }
  };

  const handlePaymentChange = (method: string) => {
    setPaymentMethod(method);
    if (method === 'Bank Transfer') {
      setPaymentStatus('Paid');
    } else {
      setPaymentStatus('COD - Due on Arrival');
    }
  };

  const handleCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) {
      alert('Cart is empty! Please add products to the sale before completing checkout.');
      return;
    }

    const newOrder = recordMultiSale({
      items: cart,
      customerName: customerName.trim() || 'Walk-in Customer',
      customerPhone: customerPhone.trim() || '012 000 000',
      ownerPhone: locationType === 'Province' ? (ownerPhone.trim() || '017 249 041') : undefined,
      orderPlatform,
      locationType,
      deliveryAddress: deliveryAddress.trim() || (locationType === 'Phnom Penh' ? 'Phnom Penh Store Counter' : 'Provincial Delivery Station'),
      paymentMethod,
      paymentStatus,
      notes: 'Direct Point of Sale Terminal'
    });

    if (newOrder) {
      setLastCompletedOrder(newOrder);
      onOpenReceiptModal(newOrder);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white font-['Syne']">
              SoleTrack Fast Sell & POS Terminal
            </h1>
            <p className="text-xs text-slate-400">
              Multi-product checkout, inventory deduction, and instant thermal receipt printing
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {lastCompletedOrder && (
            <button
              type="button"
              onClick={() => onOpenReceiptModal(lastCompletedOrder)}
              className="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors border border-slate-700"
            >
              <Printer className="w-3.5 h-3.5 text-amber-400" />
              <span>Reprint Last (#{lastCompletedOrder.orderNumber})</span>
            </button>
          )}

          <div className="flex items-center gap-1.5 py-2 px-3 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono">
            <ShoppingCart className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-slate-400">Register:</span>
            <strong className="text-amber-400 font-bold">{totalCartItems} pairs</strong>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Shoe Catalog Grid (7 cols) */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            {/* Catalog Search & Active Selection Info */}
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search catalog by shoe name or SKU..."
                  value={catalogSearch}
                  onChange={(e) => setCatalogSearch(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            {/* Catalog Tiles */}
            {filteredProducts.length === 0 ? (
              <div className="py-14 text-center bg-slate-950/60 border border-slate-800 rounded-xl p-6">
                <ShoppingBag className="w-10 h-10 text-slate-700 mx-auto mb-2" />
                <h4 className="text-xs font-bold text-slate-300">No Shoes in Catalog</h4>
                <p className="text-[11px] text-slate-500 mt-1 max-w-xs mx-auto">
                  {products.length === 0
                    ? 'No shoe products added yet. Go to the Footwear Catalog tab to add your first product.'
                    : 'No shoes match your search query.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[460px] overflow-y-auto pr-1">
                {filteredProducts.map(p => {
                  const isSelected = activeProduct?.id === p.id;

                  return (
                    <div
                      key={p.id}
                      onClick={() => handleProductSelect(p)}
                      className={`p-3 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                        isSelected
                          ? 'border-amber-400 bg-slate-800/90 ring-2 ring-amber-400/30 shadow-md'
                          : 'border-slate-800 bg-slate-950/70 hover:border-slate-700'
                      }`}
                    >
                      <div className="w-full h-24 sm:h-28 rounded-lg overflow-hidden bg-slate-900 mb-2.5 flex items-center justify-center">
                        {p.images[0] ? (
                          <img 
                            src={p.images[0]} 
                            alt="" 
                            className="w-full h-full object-cover" 
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <ShoppingBag className="w-8 h-8 text-slate-700" />
                        )}
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-[10px] uppercase font-mono text-amber-400">{p.gender}</span>
                          <span className="text-[9px] font-mono font-bold text-slate-400">{p.sku}</span>
                        </div>
                        <h4 className="text-xs font-bold text-slate-200 line-clamp-1">{p.name}</h4>
                        <div className="flex items-center justify-between mt-1 pt-1 border-t border-slate-800/80">
                          <span className="text-xs font-mono font-bold text-amber-300">${p.retailPrice.toFixed(2)}</span>
                          <span className="text-[10px] font-mono text-slate-400">{p.totalStock} in stock</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Active Shoe Quick Config & Add to Register */}
            {activeProduct && (
              <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                      Configure Pair
                    </span>
                    <span className="text-xs font-bold text-white truncate max-w-[200px]">
                      {activeProduct.name} ({activeProduct.sku})
                    </span>
                  </div>
                  <span className="text-xs font-mono font-bold text-amber-400">
                    ${activeProduct.retailPrice.toFixed(2)}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-400 mb-1">Color</label>
                    <select
                      value={selectedColor}
                      onChange={(e) => setSelectedColor(e.target.value as ShoeColor)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-400"
                    >
                      {availableColors.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-slate-400 mb-1">Size</label>
                    <select
                      value={selectedSize}
                      onChange={(e) => setSelectedSize(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-amber-400"
                    >
                      {availableSizes.map(s => (
                        <option key={s} value={s}>Size {s}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-slate-400 mb-1">Qty (Stock: {currentStock})</label>
                    <div className="flex items-center bg-slate-900 border border-slate-700 rounded-lg">
                      <button
                        type="button"
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="px-2 py-1.5 text-slate-400 hover:text-white"
                      >
                        -
                      </button>
                      <span className="flex-1 text-center text-xs font-mono font-bold text-white">
                        {quantity}
                      </span>
                      <button
                        type="button"
                        disabled={quantity >= currentStock}
                        onClick={() => setQuantity(quantity + 1)}
                        className="px-2 py-1.5 text-slate-400 hover:text-white disabled:opacity-30"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div className="flex items-end">
                    <button
                      type="button"
                      disabled={currentStock === 0}
                      onClick={handleAddCurrentToCart}
                      className="w-full py-2 px-3 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:bg-slate-800 disabled:text-slate-600 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95"
                    >
                      {addFeedback ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                      <span>{addFeedback ? 'Added!' : '+ Add to Sale'}</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Active Multi-Item POS Terminal (5 cols) */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-amber-400" />
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                  Sale Register ({cart.length} items · {totalCartItems} pairs)
                </h3>
              </div>
              {cart.length > 0 && (
                <button
                  type="button"
                  onClick={clearCart}
                  className="text-[11px] text-slate-500 hover:text-rose-400 transition-colors"
                >
                  Clear All
                </button>
              )}
            </div>

            {/* Cart Items List */}
            {cart.length === 0 ? (
              <div className="py-12 text-center bg-slate-950/60 rounded-xl border border-dashed border-slate-800 p-4 space-y-2">
                <ShoppingCart className="w-8 h-8 text-slate-600 mx-auto" />
                <p className="text-xs font-semibold text-slate-400">Sale Cart is Empty</p>
                <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                  Pick shoes from the catalog, select color and size, then click &quot;+ Add to Sale&quot; to ring up multiple items.
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                {cart.map((item) => (
                  <div 
                    key={item.id}
                    className="p-2.5 bg-slate-950 rounded-xl border border-slate-800/80 flex items-center justify-between gap-2.5"
                  >
                    <div className="w-10 h-10 rounded-lg bg-slate-900 overflow-hidden shrink-0 border border-slate-800 flex items-center justify-center">
                      {item.productImage ? (
                        <img src={item.productImage} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <ShoppingBag className="w-4 h-4 text-slate-700" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs font-bold text-white truncate">{item.productName}</h4>
                      <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-400">
                        <span className="text-amber-400 font-bold">{item.sku}</span>
                        <span>·</span>
                        <span>Size {item.size}</span>
                        <span>·</span>
                        <span>{item.color}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg">
                        <button
                          type="button"
                          onClick={() => updateCartQuantity(item.id, item.quantity - 1)}
                          className="px-1.5 py-0.5 text-slate-400 hover:text-white"
                        >
                          <Minus className="w-2.5 h-2.5" />
                        </button>
                        <span className="px-1.5 text-[11px] font-mono font-bold text-white">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          disabled={item.quantity >= item.stock}
                          onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
                          className="px-1.5 py-0.5 text-slate-400 hover:text-white disabled:opacity-30"
                        >
                          <Plus className="w-2.5 h-2.5" />
                        </button>
                      </div>

                      <span className="text-xs font-mono font-bold text-amber-300 w-14 text-right">
                        ${(item.unitPrice * item.quantity).toFixed(2)}
                      </span>

                      <button
                        type="button"
                        onClick={() => removeFromCart(item.id)}
                        className="text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 p-1 rounded-lg transition-colors"
                        title="Remove product"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Fast Register Form */}
            <form onSubmit={handleCheckout} className="space-y-3 pt-2">
              {/* Order Platform Selector: Page, Telegram, TikTok */}
              <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setOrderPlatform('Page')}
                  className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all ${
                    orderPlatform === 'Page'
                      ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>Page</span>
                </button>
                <button
                  type="button"
                  onClick={() => setOrderPlatform('Telegram')}
                  className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all ${
                    orderPlatform === 'Telegram'
                      ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Telegram</span>
                </button>
                <button
                  type="button"
                  onClick={() => setOrderPlatform('TikTok')}
                  className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all ${
                    orderPlatform === 'TikTok'
                      ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  <Video className="w-3.5 h-3.5" />
                  <span>TikTok</span>
                </button>
              </div>

              {/* Destination */}
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleLocationChange('Phnom Penh')}
                    className={`py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 ${
                      locationType === 'Phnom Penh'
                        ? 'bg-amber-500 text-slate-950 font-bold'
                        : 'bg-slate-950 border border-slate-800 text-slate-400'
                    }`}
                  >
                    <Building2 className="w-3 h-3" />
                    <span>Phnom Penh</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleLocationChange('Province')}
                    className={`py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 ${
                      locationType === 'Province'
                        ? 'bg-amber-500 text-slate-950 font-bold'
                        : 'bg-slate-950 border border-slate-800 text-slate-400'
                    }`}
                  >
                    <MapPin className="w-3 h-3" />
                    <span>Provinces</span>
                  </button>
                </div>

                {/* Delivery Address Input */}
                <div>
                  <input
                    type="text"
                    required
                    placeholder={locationType === 'Phnom Penh' ? "Street Address / Drop-off location..." : "Province / Delivery Address..."}
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-500"
                  />
                </div>
              </div>

              {/* Customer Information */}
              <div className="space-y-2">
                {locationType === 'Province' && (
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-0.5">Sender Phone (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. 017 249 041"
                      value={ownerPhone}
                      onChange={(e) => setOwnerPhone(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs font-mono text-white placeholder-slate-600 focus:outline-none focus:border-amber-400"
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-0.5">Customer Name</label>
                    <input
                      type="text"
                      required
                      placeholder="Customer name..."
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-400"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-0.5">Customer Phone</label>
                    <input
                      type="text"
                      required
                      placeholder="012 345 678"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs font-mono text-white placeholder-slate-600 focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div>
                <div className="flex items-center justify-between mb-0.5">
                  <label className="block text-[10px] text-slate-400">Payment Method</label>
                  {paymentMethod === 'Bank Transfer' && (
                    <span className="text-[9px] text-emerald-400 font-semibold">✓ Already Paid</span>
                  )}
                </div>
                <select
                  value={paymentMethod}
                  onChange={(e) => handlePaymentChange(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-400"
                >
                  <option value="Bank Transfer">Bank Transfer (Paid)</option>
                  {locationType === 'Phnom Penh' && (
                    <option value="Cash on Delivery (COD)">Cash on Delivery (COD)</option>
                  )}
                </select>
              </div>

              {/* Total Summary */}
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Total Products:</span>
                  <span className="font-mono text-white font-bold">{cart.length} {cart.length === 1 ? 'Product' : 'Products'}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Subtotal:</span>
                  <span className="font-mono text-white font-medium">${totalCartAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Delivery Fee:</span>
                  <span className="font-mono text-white font-medium">$1.50</span>
                </div>
                <div className="flex justify-between text-sm font-black border-t border-slate-800 pt-1.5 text-white">
                  <span>Grand Total:</span>
                  <span className="font-mono text-amber-400 text-base">${(totalCartAmount + 1.5).toFixed(2)}</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={cart.length === 0}
                className="w-full py-3 px-3.5 sm:px-4 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:bg-slate-800 disabled:text-slate-600 text-slate-950 font-bold transition-all shadow-md active:scale-[0.98] flex items-center justify-between gap-2"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span className="text-xs sm:text-sm font-bold truncate">
                    Complete Sale ({cart.length} {cart.length === 1 ? 'Product' : 'Products'})
                  </span>
                </div>
                <span className="font-mono font-black text-xs sm:text-sm bg-black/15 px-2 py-0.5 rounded-lg shrink-0">
                  ${(totalCartAmount + 1.5).toFixed(2)}
                </span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
