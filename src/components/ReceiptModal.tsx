import React, { useRef } from 'react';
import { X, Printer, Truck, CheckCircle, QrCode, MapPin, Phone, User, Calendar } from 'lucide-react';
import { SaleOrder } from '../types';

interface ReceiptModalProps {
  order: SaleOrder | null;
  isOpen: boolean;
  onClose: () => void;
  onNavigateToTracking: (orderNumber: string) => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  order,
  isOpen,
  onClose,
  onNavigateToTracking
}) => {
  const receiptRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !order) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleTrackClick = () => {
    onClose();
    onNavigateToTracking(order.orderNumber);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto animate-in fade-in">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-2xl overflow-hidden shadow-2xl my-auto">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-2 text-emerald-400">
            <CheckCircle className="w-5 h-5" />
            <span className="font-bold text-sm tracking-wide text-white">Sale Recorded Successfully</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Receipt Paper Container */}
        <div className="p-6">
          <div 
            ref={receiptRef}
            className="bg-white text-slate-950 p-6 rounded-xl shadow-lg border border-slate-200 font-sans print:shadow-none print:border-none print:m-0"
          >
            {/* Header Brand */}
            <div className="text-center border-b border-dashed border-slate-300 pb-4 mb-4">
              <h2 className="text-lg font-black tracking-tight font-['Syne']">SOLETRACK FOOTWEAR</h2>
              <p className="text-[11px] text-slate-600">Phnom Penh Flagship & Province Dispatch Hub</p>
              <p className="text-[10px] text-slate-500 font-mono mt-0.5">Tel: +855 (0) 12 884 921 · VAT Registered</p>
              
              <div className="mt-3 inline-block bg-slate-100 px-3 py-1 rounded text-xs font-mono font-bold text-slate-800">
                ORDER #{order.orderNumber}
              </div>
            </div>

            {/* Date & Customer Info */}
            <div className="text-xs space-y-1.5 border-b border-dashed border-slate-300 pb-3 mb-3">
              <div className="flex justify-between">
                <span className="text-slate-500">Date & Time:</span>
                <span className="font-mono text-slate-800">
                  {new Date(order.createdAt).toLocaleDateString('en-GB', { 
                    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' 
                  })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Customer:</span>
                <span className="font-semibold text-slate-900">{order.customerName}</span>
              </div>
              {order.orderPlatform && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Channel / Platform:</span>
                  <span className="font-semibold text-amber-600 bg-amber-50 px-1.5 py-0.2 rounded text-[11px] border border-amber-200">
                    {order.orderPlatform}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-500">Phone:</span>
                <span className="font-mono text-slate-900">{order.customerPhone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Destination:</span>
                <span className="font-medium text-slate-900 text-right max-w-[200px] truncate">
                  {order.locationType === 'Phnom Penh' ? `${order.district || 'Phnom Penh'}` : `${order.provinceName || 'Province'}`}
                </span>
              </div>
              {order.locationType === 'Province' && (
                <div className="flex justify-between text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  <span className="font-medium text-[11px]">Sender Phone (VET/J&T):</span>
                  <span className="font-mono font-bold text-[11px]">{order.ownerPhone || '017 249 041'}</span>
                </div>
              )}
              <div className="text-[11px] text-slate-600 italic">
                Address: {order.deliveryAddress}
              </div>
            </div>

            {/* Itemized Table */}
            <div className="border-b border-dashed border-slate-300 pb-3 mb-3">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-slate-500 border-b border-slate-200">
                    <th className="text-left pb-1 font-semibold">Item / Variant</th>
                    <th className="text-center pb-1 font-semibold">Qty</th>
                    <th className="text-right pb-1 font-semibold">Price</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {order.items && order.items.length > 0 ? (
                    order.items.map((item, idx) => (
                      <tr key={idx}>
                        <td className="py-2 pr-2">
                          <p className="font-bold text-slate-900 leading-tight">{item.productName}</p>
                          <p className="text-[11px] text-slate-500 font-mono">
                            <span className="font-bold text-slate-700">{item.sku}</span> · Size {item.size} · {item.color}
                          </p>
                        </td>
                        <td className="py-2 text-center font-mono font-semibold">{item.quantity}</td>
                        <td className="py-2 text-right font-mono font-bold">${item.totalAmount.toFixed(2)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td className="py-2 pr-2">
                        <p className="font-bold text-slate-900 leading-tight">{order.productName}</p>
                        <p className="text-[11px] text-slate-500 font-mono">
                          Size {order.size} · {order.color}
                        </p>
                      </td>
                      <td className="py-2 text-center font-mono font-semibold">{order.quantity}</td>
                      <td className="py-2 text-right font-mono font-bold">${order.totalAmount.toFixed(2)}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Total Breakdown */}
            <div className="space-y-1.5 text-xs mb-4">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal ({order.quantity} {order.quantity === 1 ? 'pair' : 'pairs'})</span>
                <span className="font-mono">${order.totalAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Delivery Fee</span>
                <span className="font-mono font-medium text-slate-700">$1.50</span>
              </div>
              <div className="flex justify-between text-base font-black border-t border-slate-300 pt-2 text-slate-950">
                <span>Grand Total (USD)</span>
                <span className="font-mono text-lg">${order.totalAmount.toFixed(2)}</span>
              </div>
            </div>

            {/* Payment & QR Footer */}
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between text-xs">
              <div>
                <span className="text-[10px] uppercase text-slate-500 font-semibold block">Payment Method</span>
                <span className="font-bold text-slate-900">{order.paymentMethod}</span>
                <span className="text-[11px] text-emerald-600 font-mono block mt-0.5 font-bold">
                  Status: {order.paymentStatus}
                </span>
              </div>
              <div className="w-12 h-12 bg-white p-1 rounded border border-slate-300 flex items-center justify-center">
                <QrCode className="w-10 h-10 text-slate-800" />
              </div>
            </div>

            <p className="text-[10px] text-center text-slate-500 mt-4 leading-normal">
              Thank you for choosing SoleTrack! Free size exchange within 7 days in original condition.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="mt-5 flex items-center gap-3">
            <button
              type="button"
              onClick={handlePrint}
              className="flex-1 py-2.5 px-4 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              <Printer className="w-4 h-4" />
              Print Thermal Invoice
            </button>
            <button
              type="button"
              onClick={handleTrackClick}
              className="flex-1 py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-md shadow-amber-500/10"
            >
              <Truck className="w-4 h-4" />
              Track Delivery
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
