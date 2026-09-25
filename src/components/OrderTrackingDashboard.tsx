import React, { useState } from 'react';
import { 
  Truck, 
  Search, 
  CheckCircle2, 
  Clock, 
  Package, 
  MapPin, 
  Phone, 
  User, 
  Navigation, 
  ShieldCheck, 
  ArrowRight,
  ExternalLink,
  ChevronRight,
  Filter
} from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { SaleOrder, OrderStatus } from '../types';

interface OrderTrackingDashboardProps {
  initialSearchQuery?: string;
  onOpenReceiptModal: (order: SaleOrder) => void;
}

const ORDER_STEPS: OrderStatus[] = [
  'Confirmed',
  'Packing',
  'Dispatched',
  'Out for Delivery',
  'Delivered'
];

export const OrderTrackingDashboard: React.FC<OrderTrackingDashboardProps> = ({
  initialSearchQuery = '',
  onOpenReceiptModal
}) => {
  const { orders, updateOrderStatus } = useInventory();
  const [activeMode, setActiveMode] = useState<'seller' | 'customer'>('seller');
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [selectedOrder, setSelectedOrder] = useState<SaleOrder | null>(orders[0] || null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  // Status update modal state
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<boolean>(false);
  const [newStatus, setNewStatus] = useState<OrderStatus>('Dispatched');
  const [updateLocation, setUpdateLocation] = useState<string>('');
  const [updateNote, setUpdateNote] = useState<string>('');
  const [courierRider, setCourierRider] = useState<string>('');
  const [courierPhone, setCourierPhone] = useState<string>('');

  // Search logic for customer tracker
  const searchResults = orders.filter(o => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      o.orderNumber.toLowerCase().includes(q) ||
      o.customerPhone.toLowerCase().includes(q) ||
      o.customerName.toLowerCase().includes(q) ||
      o.productName.toLowerCase().includes(q)
    );
  });

  const filteredOrders = orders.filter(o => {
    if (statusFilter === 'all') return true;
    return o.orderStatus === statusFilter;
  });

  const handleSelectOrder = (order: SaleOrder) => {
    setSelectedOrder(order);
  };

  const handleUpdateStatusSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;

    updateOrderStatus(
      selectedOrder.id,
      newStatus,
      updateNote || `Package advanced to ${newStatus}`,
      updateLocation || (selectedOrder.locationType === 'Phnom Penh' ? 'Phnom Penh Urban Route' : `${selectedOrder.provinceName || 'Provincial'} Logistics Depot`),
      courierRider,
      courierPhone
    );

    // Refresh selected order
    const updated = orders.find(o => o.id === selectedOrder.id);
    if (updated) setSelectedOrder(updated);

    setIsUpdatingStatus(false);
    setUpdateNote('');
    setUpdateLocation('');
  };

  const currentStepIndex = (status: OrderStatus) => {
    return ORDER_STEPS.indexOf(status);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Mode Switcher */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 p-4 sm:p-5 rounded-2xl">
        <div>
          <h1 className="text-xl font-bold font-['Syne'] text-white flex items-center gap-2">
            <Truck className="w-5 h-5 text-amber-400" />
            <span>Real-Time Order Logistics & Tracking</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Track deliveries across Phnom Penh districts and Cambodian provinces with live status checkpoints
          </p>
        </div>

        {/* Segmented Control */}
        <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-xl border border-slate-800">
          <button
            type="button"
            onClick={() => setActiveMode('seller')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeMode === 'seller'
                ? 'bg-slate-800 text-amber-300 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Seller Management
          </button>
          <button
            type="button"
            onClick={() => setActiveMode('customer')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeMode === 'customer'
                ? 'bg-slate-800 text-amber-300 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Customer Order Lookup
          </button>
        </div>
      </div>

      {/* Customer Mode: Public Tracking Search */}
      {activeMode === 'customer' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-6">
          <div className="max-w-xl mx-auto text-center space-y-3">
            <h2 className="text-lg font-bold text-white font-['Syne']">
              Track Your Footwear Package
            </h2>
            <p className="text-xs text-slate-400">
              Enter your Order Number (e.g. <strong className="text-amber-400 font-mono">ST-9042</strong>) or registered phone number
            </p>
            
            <div className="relative flex items-center">
              <Search className="w-4 h-4 absolute left-3.5 text-slate-500" />
              <input
                type="text"
                placeholder="Search by Order # (ST-XXXX) or Phone (012 XXX XXX)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-24 py-3 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 shadow-inner"
              />
              <span className="absolute right-3 text-[11px] font-mono text-slate-500">
                {searchResults.length} found
              </span>
            </div>
          </div>

          {/* Customer Result Cards */}
          <div className="max-w-3xl mx-auto space-y-4">
            {searchResults.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-xs">
                No orders matching "{searchQuery}". Check the order number on your digital receipt.
              </div>
            ) : (
              searchResults.map(order => (
                <div 
                  key={order.id}
                  className="p-5 bg-slate-950 rounded-2xl border border-slate-800 space-y-4 hover:border-slate-700 transition-colors"
                >
                  {/* Header */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                          #{order.orderNumber}
                        </span>
                        <span className="text-xs font-semibold text-white">{order.productName}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-2">
                        <span>{order.quantity} pairs total</span>
                        <span aria-hidden="true">·</span>
                        <span>{order.locationType === 'Phnom Penh' ? order.district : order.provinceName}</span>
                        <span aria-hidden="true">·</span>
                        <span className="text-amber-300 font-mono">${order.totalAmount.toFixed(2)}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold font-mono px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                        {order.orderStatus}
                      </span>
                      <button
                        type="button"
                        onClick={() => onOpenReceiptModal(order)}
                        className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 hover:underline"
                      >
                        Receipt <ExternalLink className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* Horizontal Timeline */}
                  <div className="py-2">
                    <div className="grid grid-cols-5 gap-1 text-center relative">
                      {ORDER_STEPS.map((step, idx) => {
                        const isCompleted = currentStepIndex(order.orderStatus) >= idx;
                        const isCurrent = order.orderStatus === step;

                        return (
                          <div key={step} className="flex flex-col items-center">
                            <div 
                              className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold z-10 transition-colors ${
                                isCompleted
                                  ? 'bg-amber-500 text-slate-950 ring-2 ring-amber-400/40'
                                  : 'bg-slate-800 text-slate-500 border border-slate-700'
                              }`}
                            >
                              {isCompleted ? '✓' : idx + 1}
                            </div>
                            <span className={`text-[10px] mt-1.5 leading-tight ${isCurrent ? 'text-amber-400 font-bold' : isCompleted ? 'text-slate-300' : 'text-slate-600'}`}>
                              {step}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Detailed Timeline Checkpoints */}
                  <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-2">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block">
                      Live Route Milestones
                    </span>
                    <div className="space-y-2 divide-y divide-slate-800/40 font-mono text-xs">
                      {order.trackingHistory.map((step, sIdx) => (
                        <div key={sIdx} className="pt-2 first:pt-0 flex items-start justify-between gap-3">
                          <div>
                            <span className="font-bold text-slate-200 block text-[11px]">{step.status} — {step.location}</span>
                            <span className="text-[11px] text-slate-400 font-sans">{step.note}</span>
                          </div>
                          <span className="text-[10px] text-slate-500 shrink-0">
                            {new Date(step.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Seller Mode: Orders Table & Interactive Status Updating */}
      {activeMode === 'seller' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Orders List (7 cols) */}
          <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden flex flex-col">
            {/* Filters Bar */}
            <div className="p-4 border-b border-slate-800 bg-slate-950/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-1 overflow-x-auto max-w-full pb-1 sm:pb-0">
                {['all', 'Confirmed', 'Packing', 'Dispatched', 'Out for Delivery', 'Delivered'].map(status => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setStatusFilter(status)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                      statusFilter === status
                        ? 'bg-slate-800 text-amber-300 border border-slate-700'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {status === 'all' ? 'All Orders' : status}
                  </button>
                ))}
              </div>

              <div className="text-xs font-mono text-slate-400 shrink-0">
                {filteredOrders.length} orders
              </div>
            </div>

            {/* Orders Table */}
            <div className="flex-1 overflow-y-auto max-h-[580px] divide-y divide-slate-800/80">
              {filteredOrders.length === 0 ? (
                <div className="p-12 text-center text-slate-500 text-xs">
                  No orders found in status "{statusFilter}".
                </div>
              ) : (
                filteredOrders.map(order => {
                  const isSelected = selectedOrder?.id === order.id;

                  return (
                    <div
                      key={order.id}
                      onClick={() => handleSelectOrder(order)}
                      className={`p-4 cursor-pointer transition-colors flex items-center justify-between gap-3 ${
                        isSelected 
                          ? 'bg-amber-500/10 border-l-4 border-amber-400' 
                          : 'hover:bg-slate-800/40'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-12 h-12 rounded-lg bg-slate-950 border border-slate-800 overflow-hidden shrink-0 flex items-center justify-center">
                          {order.productImage ? (
                            <img 
                              src={order.productImage} 
                              alt="" 
                              className="w-full h-full object-cover" 
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <Package className="w-5 h-5 text-slate-600" />
                          )}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono font-bold text-amber-400">
                              #{order.orderNumber}
                            </span>
                            <span className="text-xs font-semibold text-slate-200 truncate">
                              {order.customerName}
                            </span>
                          </div>
                          
                          <p className="text-[11px] text-slate-400 truncate mt-0.5">
                            {order.items && order.items.length > 1
                              ? `${order.quantity} pairs (${order.items.length} models) · ${order.items.map(i => i.productName).join(', ')}`
                              : `${order.productName} · Size ${order.size} (${order.color})`}
                          </p>
                          
                          <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-1">
                            {order.orderPlatform && (
                              <span className="font-semibold text-amber-400 bg-amber-500/10 px-1.5 py-0.2 rounded border border-amber-500/20">
                                {order.orderPlatform}
                              </span>
                            )}
                            <span>{order.locationType} · {order.locationType === 'Phnom Penh' ? order.district : order.provinceName}</span>
                            <span aria-hidden="true">·</span>
                            <span>{order.paymentMethod}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        <span className="text-xs font-mono font-bold text-slate-200">
                          ${order.totalAmount.toFixed(2)}
                        </span>
                        <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-slate-800 text-amber-300 border border-slate-700">
                          {order.orderStatus}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Selected Order Detailed Inspector (5 cols) */}
          <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
            {selectedOrder ? (
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                        ORDER #{selectedOrder.orderNumber}
                      </span>
                      {selectedOrder.orderPlatform && (
                        <span className="text-xs font-semibold text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/20">
                          {selectedOrder.orderPlatform}
                        </span>
                      )}
                    </div>
                    <h3 className="text-sm font-bold text-white mt-1">
                      {selectedOrder.customerName}
                    </h3>
                  </div>

                  <button
                    type="button"
                    onClick={() => onOpenReceiptModal(selectedOrder)}
                    className="py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    View Receipt
                  </button>
                </div>

                {/* Status Bar */}
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase text-slate-500 font-semibold block">Delivery Status</span>
                    <span className="text-xs font-bold text-amber-400">{selectedOrder.orderStatus}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setNewStatus(selectedOrder.orderStatus);
                      setCourierRider(selectedOrder.courierName || '');
                      setCourierPhone(selectedOrder.courierPhone || '');
                      setIsUpdatingStatus(true);
                    }}
                    className="py-1.5 px-3 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-lg transition-colors shadow-sm"
                  >
                    Update Progress
                  </button>
                </div>

                {/* Footwear Items In Order */}
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    <span>Purchased Items ({selectedOrder.quantity} pairs)</span>
                    <span className="font-mono text-amber-400 font-bold">${selectedOrder.totalAmount.toFixed(2)}</span>
                  </div>
                  <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1 text-xs">
                    {selectedOrder.items && selectedOrder.items.length > 0 ? (
                      selectedOrder.items.map((it, idx) => (
                        <div key={idx} className="flex items-center justify-between py-1 border-b border-slate-900 last:border-b-0">
                          <div className="min-w-0 pr-2">
                            <span className="font-bold text-slate-200 block truncate">{it.productName}</span>
                            <span className="text-[10px] font-mono text-slate-400">
                              <span className="text-amber-400 font-bold">{it.sku}</span> · Size {it.size} · {it.color} × {it.quantity}
                            </span>
                          </div>
                          <span className="font-mono font-bold text-slate-300 shrink-0">
                            ${it.totalAmount.toFixed(2)}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="flex items-center justify-between py-1">
                        <div className="min-w-0 pr-2">
                          <span className="font-bold text-slate-200 block truncate">{selectedOrder.productName}</span>
                          <span className="text-[10px] font-mono text-slate-400">
                            Size {selectedOrder.size} · {selectedOrder.color} × {selectedOrder.quantity}
                          </span>
                        </div>
                        <span className="font-mono font-bold text-slate-300 shrink-0">
                          ${selectedOrder.totalAmount.toFixed(2)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Delivery & Customer Specs */}
                <div className="space-y-2 text-xs">
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5 text-slate-500" /> Customer Phone:
                      </span>
                      <span className="font-mono text-slate-200 font-bold">{selectedOrder.customerPhone}</span>
                    </div>

                    {selectedOrder.locationType === 'Province' && (
                      <div className="flex items-center justify-between bg-amber-500/10 px-2 py-1 rounded-lg border border-amber-500/20">
                        <span className="text-amber-300 font-medium text-[11px]">Sender Phone (VET/J&T):</span>
                        <span className="font-mono text-amber-200 font-bold text-[11px]">{selectedOrder.ownerPhone || '017 249 041'}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-500" /> Zone:
                      </span>
                      <span className="text-slate-200">
                        {selectedOrder.locationType} · {selectedOrder.locationType === 'Phnom Penh' ? selectedOrder.district : selectedOrder.provinceName}
                      </span>
                    </div>

                    <div className="pt-1 text-[11px] text-slate-400">
                      <strong>Address:</strong> {selectedOrder.deliveryAddress}
                    </div>
                  </div>

                  {/* Payment Specs */}
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Payment Gateway:</span>
                      <span className="font-bold text-slate-200">{selectedOrder.paymentMethod}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Payment Status:</span>
                      <span className="font-mono font-bold text-emerald-400">{selectedOrder.paymentStatus}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Order Profit:</span>
                      <span className="font-mono text-amber-400">+${selectedOrder.profit.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Live History Timeline */}
                <div className="space-y-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Dispatch History Log
                  </span>
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1 text-xs font-mono">
                    {selectedOrder.trackingHistory.map((step, idx) => (
                      <div key={idx} className="p-2 bg-slate-950/60 rounded-lg border border-slate-800/60">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold text-amber-300">{step.status}</span>
                          <span className="text-[10px] text-slate-500">
                            {new Date(step.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-300 font-sans mt-0.5">{step.location} — {step.note}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-20 text-slate-500 text-xs">
                Select an order from the list to inspect logistics.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Update Order Status Modal */}
      {isUpdatingStatus && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white font-['Syne']">
              Advance Order #{selectedOrder.orderNumber}
            </h3>

            <form onSubmit={handleUpdateStatusSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">New Milestone Status</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as OrderStatus)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-amber-400"
                >
                  {ORDER_STEPS.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Check-in Location / Depot</label>
                <input
                  type="text"
                  placeholder="e.g. National Road 6 Hub / Daun Penh Route"
                  value={updateLocation}
                  onChange={(e) => setUpdateLocation(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Courier / Rider Name</label>
                <input
                  type="text"
                  placeholder="e.g. Virak Buntham Logistics (Rider #22)"
                  value={courierRider}
                  onChange={(e) => setCourierRider(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Update Log Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Package dispatched on express trunk van"
                  value={updateNote}
                  onChange={(e) => setUpdateNote(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="flex items-center gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsUpdatingStatus(false)}
                  className="flex-1 py-2 rounded-xl border border-slate-700 bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold"
                >
                  Save Milestone
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
