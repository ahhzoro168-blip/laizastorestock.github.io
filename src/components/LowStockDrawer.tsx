import React from 'react';
import { X, AlertTriangle, Sparkles, ArrowRight, Plus } from 'lucide-react';
import { useInventory } from '../context/InventoryContext';

interface LowStockDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToPO: () => void;
}

export const LowStockDrawer: React.FC<LowStockDrawerProps> = ({
  isOpen,
  onClose,
  onNavigateToPO
}) => {
  const { lowStockItems, generateAutomatedPO, updateVariantStock } = useInventory();

  if (!isOpen) return null;

  const handleGeneratePO = () => {
    generateAutomatedPO();
    onClose();
    onNavigateToPO();
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div 
        className="w-full max-w-md bg-slate-900 border-l border-slate-800 h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-200"
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-tight">Low Stock Alert Center</h2>
              <p className="text-xs text-slate-400 font-mono">
                {lowStockItems.length} variant{lowStockItems.length === 1 ? '' : 's'} need replenishment
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Auto PO Action Card */}
        <div className="p-4 bg-amber-500/10 border-b border-amber-500/20 m-4 rounded-xl">
          <div className="flex items-start gap-3 mb-3">
            <Sparkles className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-xs font-bold text-amber-300">Automated Restocking System</h3>
              <p className="text-[11px] text-slate-300 leading-relaxed mt-0.5">
                Instantly compile all low-stock sizes and high-demand colors into a vendor-ready Purchase Order with smart volume suggestions.
              </p>
            </div>
          </div>
          <button
            onClick={handleGeneratePO}
            className="w-full py-2.5 px-4 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-md shadow-amber-500/10"
          >
            <span>Create Automated Purchase Order</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* List of Low Stock Items */}
        <div className="flex-1 overflow-y-auto px-4 divide-y divide-slate-800/60">
          {lowStockItems.length === 0 ? (
            <div className="py-16 text-center text-slate-500">
              <p className="text-sm font-medium text-slate-400">All Shoe Variants Healthy</p>
              <p className="text-xs mt-1">No items currently fall below minimum stock safety threshold.</p>
            </div>
          ) : (
            lowStockItems.map((item, idx) => {
              const isOut = item.currentStock === 0;
              return (
                <div key={`${item.productId}-${item.size}-${item.color}-${idx}`} className="py-3.5 flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-slate-800 border border-slate-700 overflow-hidden shrink-0 flex items-center justify-center">
                    {item.productImage ? (
                      <img 
                        src={item.productImage} 
                        alt={item.productName} 
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <span className="text-[10px] text-slate-500 font-mono">IMG</span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-semibold text-slate-200 truncate">{item.productName}</h4>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                      <span className="text-amber-400/90 font-medium">Size {item.size}</span>
                      <span aria-hidden="true">·</span>
                      <span>{item.color}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono text-slate-500">{item.sku}</span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <span 
                      className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                        isOut ? 'bg-rose-500/20 text-rose-400' : 'bg-amber-500/20 text-amber-300'
                      }`}
                    >
                      {item.currentStock} left (min {item.minThreshold})
                    </span>

                    {/* Quick +5 manual stock adder */}
                    <button
                      type="button"
                      onClick={() => updateVariantStock(item.productId, item.size, item.color, item.currentStock + 5)}
                      className="text-[10px] text-slate-400 hover:text-white flex items-center gap-0.5 hover:underline"
                      title="Direct +5 stock adjustment"
                    >
                      <Plus className="w-3 h-3" /> Add 5
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 text-center">
          <p className="text-[11px] text-slate-500 font-mono">
            SoleTrack Real-Time Threshold Monitor (Threshold $\le 5$ pairs)
          </p>
        </div>
      </div>
    </div>
  );
};
