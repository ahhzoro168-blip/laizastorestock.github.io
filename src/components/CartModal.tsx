import React, { useState, useEffect } from 'react';
import { 
  X, 
  ShoppingCart, 
  Trash2, 
  Plus, 
  Minus, 
  MapPin, 
  CreditCard, 
  QrCode, 
  Building2, 
  User, 
  Phone, 
  AlertCircle, 
  CheckCircle2, 
  ArrowRight,
  Globe,
  Send,
  Video
} from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { 
  ShoeProduct, 
  ShoeColor, 
  LocationType, 
  OrderPlatform,
  PhnomPenhPaymentMethod, 
  ProvincePaymentMethod, 
  SaleOrder 
} from '../types';
import { CAMBODIA_PROVINCES, PHNOM_PENH_DISTRICTS } from '../data/mockData';

interface CartModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaleSuccess: (saleOrder: SaleOrder) => void;
  preSelectedProduct?: ShoeProduct | null;
  preSelectedSize?: number;
  preSelectedColor?: ShoeColor;
}

const PHNOM_PENH_PAYMENTS: PhnomPenhPaymentMethod[] = [
  'Bank Transfer',
  'Cash on Delivery (COD)'
];

const PROVINCE_PAYMENTS: ProvincePaymentMethod[] = [
  'Bank Transfer'
];

export const CartModal: React.FC<CartModalProps> = ({
  isOpen,
  onClose,
  onSaleSuccess,
  preSelectedProduct,
  preSelectedSize,
  preSelectedColor
}) => {
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

  // Customer & Location - clean initial state
  const [orderPlatform, setOrderPlatform] = useState<OrderPlatform>('Page');
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [ownerPhone, setOwnerPhone] = useState<string>('');
  const [locationType, setLocationType] = useState<LocationType>('Phnom Penh');
  const [deliveryAddress, setDeliveryAddress] = useState<string>('');
  
  // Payment: Bank Transfer is default and means customer has already paid
  const [paymentMethod, setPaymentMethod] = useState<string>('Bank Transfer');
  const [paymentStatus, setPaymentStatus] = useState<'Paid' | 'Pending' | 'COD - Due on Arrival'>('Paid');
  const [notes, setNotes] = useState<string>('');

  const handlePaymentMethodChange = (method: string) => {
    setPaymentMethod(method);
    if (method === 'Bank Transfer') {
      setPaymentStatus('Paid');
    } else {
      setPaymentStatus('COD - Due on Arrival');
    }
  };

  // Adjust payment defaults on location switch
  useEffect(() => {
    setPaymentMethod('Bank Transfer');
    setPaymentStatus('Paid');
  }, [locationType]);

  if (!isOpen) return null;

  const handleCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) {
      alert('Your cart is empty! Add products before checking out.');
      return;
    }

    const createdOrder = recordMultiSale({
      items: cart,
      customerName: customerName.trim() || 'Walk-in Customer',
      customerPhone: customerPhone.trim() || 'N/A',
      ownerPhone: locationType === 'Province' ? (ownerPhone.trim() || undefined) : undefined,
      orderPlatform,
      locationType,
      deliveryAddress: deliveryAddress.trim() || (locationType === 'Phnom Penh' ? 'Phnom Penh Delivery' : 'Provincial Delivery'),
      paymentMethod,
      paymentStatus,
      notes: notes.trim() ? notes.trim() : undefined
    });

    if (createdOrder) {
      onSaleSuccess(createdOrder);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md overflow-hidden animate-in fade-in">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden my-auto max-h-[95vh] sm:max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-800 bg-slate-950/70 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-1.5 sm:p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0">
              <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-bold text-white font-['Syne'] truncate">
                Cart & Checkout
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-400 truncate">
                Multi-product order & dispatch invoice
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              aria-label="Close cart"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-3.5 sm:p-6 space-y-5">
          {cart.length === 0 ? (
            /* Empty Cart View */
            <div className="py-14 px-4 text-center space-y-4 bg-slate-950/50 rounded-2xl border border-dashed border-slate-800">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-600">
                <ShoppingCart className="w-8 h-8" />
              </div>
              <div className="space-y-1.5 max-w-sm mx-auto">
                <h3 className="text-base font-bold text-white font-['Syne']">Your Cart is Empty</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Select shoe models, colors, and sizes from the inventory to assemble a multi-product order.
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="py-2.5 px-5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs inline-flex items-center gap-1.5 transition-all shadow-md shadow-amber-500/10 active:scale-95"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                  <span>Browse Shoe Catalog</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6">
              
              {/* Left Column: Cart Items (7 cols) */}
              <div className="lg:col-span-7 space-y-3.5">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Cart Items ({cart.length} product{cart.length > 1 ? 's' : ''})
                  </h3>
                  
                  <button
                    type="button"
                    onClick={onClose}
                    className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 font-semibold hover:underline"
                    title="Add more pairs from inventory catalog"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add More</span>
                  </button>
                </div>

                {/* Items List */}
                <div className="space-y-2.5 lg:max-h-[440px] lg:overflow-y-auto pr-0 lg:pr-1">
                  {cart.map((item) => {
                    const itemSubtotal = item.unitPrice * item.quantity;
                    const isMaxStock = item.quantity >= item.stock;

                    return (
                      <div 
                        key={item.id}
                        className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 hover:border-slate-700 transition-colors flex items-center gap-3.5"
                      >
                        {/* Thumbnail */}
                        <div className="w-16 h-16 rounded-lg bg-slate-900 border border-slate-800 overflow-hidden shrink-0 flex items-center justify-center">
                          {item.productImage ? (
                            <img 
                              src={item.productImage} 
                              alt={item.productName} 
                              className="w-full h-full object-cover" 
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <ShoppingCart className="w-6 h-6 text-slate-700" />
                          )}
                        </div>

                        {/* Product Info */}
                        <div className="min-w-0 flex-1">
                          <h4 className="text-xs sm:text-sm font-bold text-white truncate">
                            {item.productName}
                          </h4>

                          <div className="flex items-center gap-2 text-[11px] font-mono mt-1 text-slate-400">
                            <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-200 font-bold">
                              Size {item.size}
                            </span>
                            <span>·</span>
                            <span>{item.color}</span>
                          </div>
                        </div>

                        {/* Quantity Controls, Price & Remove X Button */}
                        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
                          <div className="flex flex-col items-end gap-1">
                            <span className="text-xs font-mono font-bold text-amber-300">
                              ${itemSubtotal.toFixed(2)}
                            </span>

                            <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg p-0.5">
                              <button
                                type="button"
                                onClick={() => updateCartQuantity(item.id, item.quantity - 1)}
                                className="w-5 h-5 sm:w-6 sm:h-6 rounded flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                                title="Decrease quantity"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="w-5 sm:w-6 text-center font-mono text-xs font-bold text-white">
                                {item.quantity}
                              </span>
                              <button
                                type="button"
                                disabled={isMaxStock}
                                onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
                                className="w-5 h-5 sm:w-6 sm:h-6 rounded flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                title={isMaxStock ? 'Max available stock reached' : 'Increase quantity'}
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                          </div>

                          {/* X Button */}
                          <button
                            type="button"
                            onClick={() => removeFromCart(item.id)}
                            className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                            title="Remove product"
                            aria-label={`Remove ${item.productName}`}
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Below Cart Items: Clear Cart */}
                <div className="flex justify-between items-center pt-2">
                  <button
                    type="button"
                    onClick={clearCart}
                    className="text-xs text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 px-3 py-1.5 rounded-lg border border-slate-800/80 hover:border-rose-500/20 transition-all flex items-center gap-1.5 font-medium"
                    title="Remove all items from cart"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear Cart</span>
                  </button>
                </div>
              </div>

              {/* Right Column: Checkout Form (5 cols) */}
              <div className="lg:col-span-5 bg-slate-950/60 p-4 sm:p-5 rounded-2xl border border-slate-800 flex flex-col justify-between space-y-4">
                <form onSubmit={handleCheckout} className="space-y-4 flex-1 flex flex-col justify-between">
                  <div className="space-y-4">
                    <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider border-b border-slate-800 pb-2">
                      Buyer & Dispatch Logistics
                    </h3>

                    {/* Order Acquisition Platform: Page, Telegram, TikTok */}
                    <div className="grid grid-cols-3 gap-2 p-1 bg-slate-900 rounded-xl border border-slate-800">
                      <button
                        type="button"
                        onClick={() => setOrderPlatform('Page')}
                        className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg text-xs font-semibold transition-all ${
                          orderPlatform === 'Page'
                            ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
                            : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                        }`}
                      >
                        <Globe className="w-3.5 h-3.5" />
                        <span>Page</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setOrderPlatform('Telegram')}
                        className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg text-xs font-semibold transition-all ${
                          orderPlatform === 'Telegram'
                            ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
                            : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                        }`}
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Telegram</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setOrderPlatform('TikTok')}
                        className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg text-xs font-semibold transition-all ${
                          orderPlatform === 'TikTok'
                            ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
                            : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                        }`}
                      >
                        <Video className="w-3.5 h-3.5" />
                        <span>TikTok</span>
                      </button>
                    </div>

                    {/* Dispatch Destination */}
                    <div className="space-y-2">
                      <label className="block text-[11px] font-semibold text-slate-400">
                        Dispatch Destination
                      </label>
                      
                      {/* Segmented Location Switch */}
                      <div className="grid grid-cols-2 gap-2 p-1 bg-slate-900 rounded-xl border border-slate-800">
                        <button
                          type="button"
                          onClick={() => setLocationType('Phnom Penh')}
                          className={`py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                            locationType === 'Phnom Penh'
                              ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          <Building2 className="w-3.5 h-3.5" />
                          <span>Phnom Penh</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setLocationType('Province')}
                          className={`py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                            locationType === 'Province'
                              ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          <MapPin className="w-3.5 h-3.5" />
                          <span>Provinces</span>
                        </button>
                      </div>

                      {/* Address input text box */}
                      <div>
                        <input
                          type="text"
                          required
                          placeholder={locationType === 'Phnom Penh' ? "Street Address / Drop-off location..." : "Province / Delivery Address..."}
                          value={deliveryAddress}
                          onChange={(e) => setDeliveryAddress(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none focus:border-amber-400 placeholder-slate-500"
                        />
                      </div>
                    </div>

                    {/* Customer Name, Phone & Sender Phone (if Province) */}
                    <div className="space-y-2.5">
                      {locationType === 'Province' && (
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                            Sender Phone (Optional)
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. 017 249 041"
                            value={ownerPhone}
                            onChange={(e) => setOwnerPhone(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs font-mono text-white placeholder-slate-600 focus:outline-none focus:border-amber-400"
                          />
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-2.5">
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                            Customer Name
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="Customer name..."
                            value={customerName}
                            onChange={(e) => setCustomerName(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-400"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                            Customer Phone
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="012 345 678"
                            value={customerPhone}
                            onChange={(e) => setCustomerPhone(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs font-mono text-white placeholder-slate-600 focus:outline-none focus:border-amber-400"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Payment Gateway */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="block text-[11px] font-semibold text-slate-400">
                          Payment Gateway
                        </label>
                        {paymentMethod === 'Bank Transfer' && (
                          <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                            <CheckCircle2 className="w-2.5 h-2.5" />
                            Already Paid
                          </span>
                        )}
                      </div>

                      <select
                        value={paymentMethod}
                        onChange={(e) => handlePaymentMethodChange(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-400"
                      >
                        {(locationType === 'Phnom Penh' ? PHNOM_PENH_PAYMENTS : PROVINCE_PAYMENTS).map(pm => (
                          <option key={pm} value={pm}>{pm}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Financial Summary Box */}
                  <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800 space-y-1.5 text-xs">
                    <div className="flex justify-between text-slate-400">
                      <span>Total Products:</span>
                      <span className="font-mono text-white font-bold">{cart.length} {cart.length === 1 ? 'Product' : 'Products'}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Subtotal:</span>
                      <span className="font-mono text-white">${totalCartAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Delivery Fee:</span>
                      <span className="font-mono text-white font-medium">$1.50</span>
                    </div>
                    <div className="flex justify-between text-sm font-black border-t border-slate-800 pt-2 text-white">
                      <span>Grand Total (USD):</span>
                      <span className="font-mono text-base text-amber-400">${(totalCartAmount + 1.5).toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    className="w-full py-3 px-3.5 sm:px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition-all shadow-lg shadow-amber-500/20 active:scale-[0.98] flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span className="text-xs sm:text-sm font-bold truncate">
                        Complete Sale ({cart.length} {cart.length === 1 ? 'Product' : 'Products'})
                      </span>
                    </div>
                    <span className="font-mono font-black text-xs sm:text-sm bg-black/15 px-2.5 py-1 rounded-lg shrink-0">
                      ${(totalCartAmount + 1.5).toFixed(2)}
                    </span>
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
