import React, { useState } from 'react';
import { 
  FileText, 
  Sparkles, 
  CheckCircle, 
  Send, 
  PackageCheck, 
  Printer, 
  Clock, 
  AlertTriangle, 
  ArrowRight,
  Plus
} from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { PurchaseOrder, POStatus } from '../types';

export const PurchaseOrdersView: React.FC = () => {
  const { purchaseOrders, lowStockItems, generateAutomatedPO, updatePOStatus } = useInventory();
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(purchaseOrders[0] || null);
  const [supplierInput, setSupplierInput] = useState('Indochina Footwear Crafts Ltd.');

  const handleGenerate = () => {
    const newPO = generateAutomatedPO(supplierInput);
    if (newPO) {
      setSelectedPO(newPO);
    }
  };

  const handlePrintPO = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Action Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Sparkles className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold font-['Syne'] text-white">
              Automated Restock & Purchase Order Engine
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1.5 max-w-xl">
            Continuously calculates reorder batch quantities for popular high-velocity shoe models and variants hitting safety thresholds (&lt; 5 pairs).
          </p>
        </div>

        {/* 1-Click Automated PO Generator */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          <button
            type="button"
            onClick={handleGenerate}
            className="w-full sm:w-auto py-3 px-6 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>Generate Smart Restock PO</span>
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Purchase Orders List (5 cols) */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
            <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Purchase Orders ({purchaseOrders.length})
            </h2>
            <span className="text-[11px] font-mono text-slate-500">Auto-restock engine active</span>
          </div>

          <div className="divide-y divide-slate-800/80 overflow-y-auto max-h-[600px]">
            {purchaseOrders.length === 0 ? (
              <div className="p-12 text-center text-slate-500 text-xs">
                No Purchase Orders created yet. Click "Generate Smart Restock PO" above.
              </div>
            ) : (
              purchaseOrders.map(po => {
                const isSelected = selectedPO?.id === po.id;
                const isRestocked = po.status === 'Goods Received & Stocked';

                return (
                  <div
                    key={po.id}
                    onClick={() => setSelectedPO(po)}
                    className={`p-4 cursor-pointer transition-colors flex items-center justify-between gap-3 ${
                      isSelected ? 'bg-amber-500/10 border-l-4 border-amber-400' : 'hover:bg-slate-800/40'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-amber-400">
                          {po.poNumber}
                        </span>
                        {po.isAutomated && (
                          <span className="text-[10px] bg-slate-800 text-slate-400 font-mono px-1.5 py-0.5 rounded border border-slate-700">
                            AUTO
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-semibold text-slate-200 mt-1 truncate">
                        {po.supplierName}
                      </p>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-1">
                        <span>{po.items.length} line item(s)</span>
                        <span aria-hidden="true">·</span>
                        <span>Due: {po.expectedDelivery}</span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <span className="text-xs font-mono font-bold text-slate-100">
                        ${po.totalAmount.toFixed(2)}
                      </span>
                      <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded ${
                        isRestocked 
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : po.status === 'Sent to Supplier'
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}>
                        {po.status}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Selected PO Detailed Sheet & Actions (7 cols) */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between">
          {selectedPO ? (
            <div className="space-y-6">
              {/* Top Meta */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-mono font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded border border-amber-500/20">
                      {selectedPO.poNumber}
                    </span>
                    <h3 className="text-base font-bold text-white font-['Syne']">
                      Restock Purchase Order
                    </h3>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Vendor: <strong className="text-slate-200">{selectedPO.supplierName}</strong> ({selectedPO.supplierContact})
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handlePrintPO}
                    className="py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    Print PO
                  </button>
                </div>
              </div>

              {/* Status Flow Stepper */}
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Current PO Lifecycle</span>
                  <span className="text-xs font-bold text-amber-300">{selectedPO.status}</span>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  {selectedPO.status === 'Draft' && (
                    <button
                      type="button"
                      onClick={() => updatePOStatus(selectedPO.id, 'Sent to Supplier')}
                      className="flex-1 sm:flex-initial py-2 px-4 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Send className="w-3.5 h-3.5" />
                      Mark as Sent to Supplier
                    </button>
                  )}

                  {selectedPO.status === 'Sent to Supplier' && (
                    <button
                      type="button"
                      onClick={() => updatePOStatus(selectedPO.id, 'Goods Received & Stocked')}
                      className="flex-1 sm:flex-initial py-2 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-colors shadow-md shadow-emerald-500/20"
                    >
                      <PackageCheck className="w-4 h-4" />
                      Receive Goods & Restock All Variants
                    </button>
                  )}

                  {selectedPO.status === 'Goods Received & Stocked' && (
                    <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20">
                      <CheckCircle className="w-4 h-4" />
                      <span>Stock Quantities Credited to Inventory</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Items Table */}
              <div>
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Line Items & Replenishment Quantities
                </h4>
                <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="border-b border-slate-800 text-[10px] text-slate-400 font-sans uppercase">
                      <tr>
                        <th className="p-3">Shoe Model & SKU</th>
                        <th className="p-3">Size / Color</th>
                        <th className="p-3 text-center">Current</th>
                        <th className="p-3 text-center">Order Qty</th>
                        <th className="p-3 text-right">Unit Cost</th>
                        <th className="p-3 text-right">Line Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {selectedPO.items.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-900/40">
                          <td className="p-3 font-sans">
                            <p className="font-semibold text-slate-200">{item.productName}</p>
                            <p className="text-[10px] text-slate-500 font-mono">{item.productSku}</p>
                          </td>
                          <td className="p-3 font-sans">
                            <span className="text-amber-400 font-medium">Size {item.size}</span> · {item.color}
                            <span className="block text-[10px] text-slate-500">{item.reason}</span>
                          </td>
                          <td className="p-3 text-center text-rose-400 font-bold">
                            {item.currentStock}
                          </td>
                          <td className="p-3 text-center text-emerald-400 font-bold">
                            +{item.reorderQty}
                          </td>
                          <td className="p-3 text-right text-slate-300">
                            ${item.unitCost.toFixed(2)}
                          </td>
                          <td className="p-3 text-right font-bold text-amber-400">
                            ${item.totalCost.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* PO Summary & Notes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Restock Notes</span>
                  <p className="text-slate-400 text-[11px] leading-relaxed">{selectedPO.notes}</p>
                </div>

                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs space-y-1.5">
                  <div className="flex justify-between text-slate-400">
                    <span>Total Pairs Ordered:</span>
                    <span className="font-mono text-slate-200 font-bold">
                      {selectedPO.items.reduce((s, i) => s + i.reorderQty, 0)} pairs
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Payment Terms:</span>
                    <span className="font-mono text-slate-200">Net 30 Days</span>
                  </div>
                  <div className="flex justify-between text-base font-bold text-white border-t border-slate-800 pt-2">
                    <span>PO Total:</span>
                    <span className="font-mono text-amber-400 font-black">${selectedPO.totalAmount.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-20 text-slate-500 text-xs">
              Select a purchase order to inspect line items.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
