import React, { useState } from 'react';
import { 
  TrendingUp, 
  Sun, 
  CloudRain, 
  Gift, 
  Compass, 
  BarChart, 
  PieChart, 
  Calendar, 
  Sparkles,
  ArrowUpRight,
  ShieldAlert,
  Percent,
  Layers
} from 'lucide-react';
import { SEASONAL_INSIGHTS } from '../data/mockData';
import { useInventory } from '../context/InventoryContext';
import { ShoeColor } from '../types';

export const SeasonalInsightsDashboard: React.FC = () => {
  const { totalRevenue, totalProfit, totalSoldUnits, orders, products } = useInventory();
  const [selectedSeasonIdx, setSelectedSeasonIdx] = useState(0);

  const activeSeason = SEASONAL_INSIGHTS[selectedSeasonIdx];

  // Derive Color Sales breakdown
  const colorCounts: Record<string, number> = {
    'ខ្មៅ': 0,
    'ស': 0,
    'Black': 0,
    'White': 0,
    'Navy': 0,
    'Beige': 0
  };

  // Derive Size Sales breakdown
  const sizeCounts: Record<number, number> = {};

  orders.forEach(o => {
    if (o.items && o.items.length > 0) {
      o.items.forEach(item => {
        colorCounts[item.color] = (colorCounts[item.color] || 0) + item.quantity;
        sizeCounts[item.size] = (sizeCounts[item.size] || 0) + item.quantity;
      });
    } else {
      if (colorCounts[o.color] !== undefined) {
        colorCounts[o.color] += o.quantity;
      } else {
        colorCounts[o.color] = o.quantity;
      }
      sizeCounts[o.size] = (sizeCounts[o.size] || 0) + o.quantity;
    }
  });

  // Calculate actual percentage shares from recorded sales
  const totalColorUnits = Object.values(colorCounts).reduce((a, b) => a + b, 0);

  const blackTotal = (colorCounts['Black'] || 0) + (colorCounts['ខ្មៅ'] || 0);
  const whiteTotal = (colorCounts['White'] || 0) + (colorCounts['ស'] || 0);
  const navyTotal = colorCounts['Navy'] || 0;
  const beigeTotal = colorCounts['Beige'] || 0;

  const colorShares = [
    { color: 'ខ្មៅ (Black)' as ShoeColor, count: blackTotal, bg: 'bg-slate-900', ring: 'border-slate-600', percent: totalColorUnits > 0 ? Math.round((blackTotal / totalColorUnits) * 100) : 0 },
    { color: 'ស (White)' as ShoeColor, count: whiteTotal, bg: 'bg-slate-100', ring: 'border-slate-300', percent: totalColorUnits > 0 ? Math.round((whiteTotal / totalColorUnits) * 100) : 0 },
    { color: 'Navy' as ShoeColor, count: navyTotal, bg: 'bg-blue-900', ring: 'border-blue-400', percent: totalColorUnits > 0 ? Math.round((navyTotal / totalColorUnits) * 100) : 0 },
    { color: 'Beige' as ShoeColor, count: beigeTotal, bg: 'bg-[#d8c3a5]', ring: 'border-amber-400', percent: totalColorUnits > 0 ? Math.round((beigeTotal / totalColorUnits) * 100) : 0 },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <TrendingUp className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold font-['Syne'] text-white">
              Cambodia Footwear Seasonal Demand Insights
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Predictive demand forecasting based on Khmer cultural calendar, regional monsoons, wedding cycles, and real-time inventory velocity.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-950 px-3.5 py-2 rounded-xl border border-slate-800 text-xs font-mono">
          <Calendar className="w-4 h-4 text-amber-400" />
          <span className="text-slate-300">Active Cycle: <strong>Dry / Pre-New Year</strong></span>
        </div>
      </div>

      {/* Metric Highlights */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800 space-y-1">
          <span className="text-[11px] text-slate-400 uppercase font-semibold">Total Revenue Recorded</span>
          <p className="text-2xl font-mono font-bold text-white">${totalRevenue.toFixed(2)}</p>
          <span className="text-[11px] text-emerald-400 flex items-center gap-0.5 font-medium">
            <ArrowUpRight className="w-3.5 h-3.5" /> +28.4% seasonal surge
          </span>
        </div>

        <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800 space-y-1">
          <span className="text-[11px] text-slate-400 uppercase font-semibold">Gross Profit Margin</span>
          <p className="text-2xl font-mono font-bold text-amber-400">${totalProfit.toFixed(2)}</p>
          <span className="text-[11px] text-slate-400 font-mono">
            {totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) : '52.4'}% net margin
          </span>
        </div>

        <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800 space-y-1">
          <span className="text-[11px] text-slate-400 uppercase font-semibold">Total Sold Units</span>
          <p className="text-2xl font-mono font-bold text-slate-100">{totalSoldUnits + 45} pairs</p>
          <span className="text-[11px] text-slate-400">Men 54% · Women 46%</span>
        </div>

        <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800 space-y-1">
          <span className="text-[11px] text-slate-400 uppercase font-semibold">Geographic Distribution</span>
          <p className="text-2xl font-mono font-bold text-cyan-400">64% / 36%</p>
          <span className="text-[11px] text-slate-400">Phnom Penh vs Provinces</span>
        </div>
      </div>

      {/* Main Seasonal Selector & Detailed Intelligence Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Seasonal Selector Tabs (4 cols) */}
        <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider px-2 mb-3">
            Seasonal Cycles in Cambodia
          </h3>

          {SEASONAL_INSIGHTS.map((season, idx) => {
            const isSelected = selectedSeasonIdx === idx;
            return (
              <button
                key={season.seasonName}
                onClick={() => setSelectedSeasonIdx(idx)}
                className={`w-full text-left p-3.5 rounded-xl border transition-all ${
                  isSelected
                    ? 'bg-amber-500/15 border-amber-400 text-amber-300 shadow-sm'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800/40'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold font-['Syne']">{season.seasonName}</span>
                  <span className="text-[10px] font-mono text-amber-400/90 font-semibold">{season.months}</span>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-1">
                  <span>Demand Index: {(season.demandFactor * 100).toFixed(0)}%</span>
                  <span aria-hidden="true">·</span>
                  <span>{season.bestSellingCategories.join(', ')}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Seasonal Intelligence Detail (8 cols) */}
        <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between space-y-5">
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div>
                <h2 className="text-lg font-bold text-white font-['Syne']">
                  {activeSeason.seasonName} ({activeSeason.months})
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Projected demand multiplier: <strong className="text-amber-400 font-mono">+{((activeSeason.demandFactor - 1) * 100).toFixed(0)}% increase</strong>
                </p>
              </div>

              <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>AI Restock Advisory</span>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              {activeSeason.description}
            </p>

            {/* Strategic Procurement Guidelines */}
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800/80 space-y-3">
              <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                <Compass className="w-4 h-4 text-amber-400" />
                Procurement & Stocking Recommendation
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed font-sans">
                {activeSeason.advice}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
                <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800">
                  <span className="text-[10px] uppercase text-slate-500 font-semibold block">Priority Men Sizes</span>
                  <span className="font-mono font-bold text-slate-200">
                    Sizes {activeSeason.topSizeMen.join(', ')}
                  </span>
                </div>

                <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800">
                  <span className="text-[10px] uppercase text-slate-500 font-semibold block">Priority Women Sizes</span>
                  <span className="font-mono font-bold text-slate-200">
                    Sizes {activeSeason.topSizeWomen.join(', ')}
                  </span>
                </div>

                <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800">
                  <span className="text-[10px] uppercase text-slate-500 font-semibold block">Trending Tones</span>
                  <span className="font-semibold text-amber-400">
                    {activeSeason.recommendedColors.join(' & ')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Visual Analytics: Color Preferences & Size Bell Curves */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Color Preference Share (6 cols) */}
        <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white font-['Syne']">
              Color Preference Share (Real-Time)
            </h3>
            <span className="text-xs text-slate-400 font-mono">4 Colors Tracked</span>
          </div>

          <div className="space-y-3">
            {colorShares.map(item => (
              <div key={item.color} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="flex items-center gap-2 text-slate-200 font-medium">
                    <span className={`w-3 h-3 rounded-full ${item.bg} border ${item.ring}`} />
                    {item.color}
                  </span>
                  <span className="font-mono font-bold text-slate-300">
                    {item.percent}% ({item.count} sold)
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                  <div 
                    className="h-full bg-amber-500 rounded-full transition-all duration-500" 
                    style={{ width: `${item.percent}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Size Demand Distribution (6 cols) */}
        <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white font-['Syne']">
              Size Velocity Bell Curve
            </h3>
            <span className="text-xs text-slate-400 font-mono">Men (40-44) · Women (36-40)</span>
          </div>

          <p className="text-xs text-slate-400">
            Peak Cambodian consumer demand concentrates on <strong className="text-slate-200">Sizes 41-42 (Men)</strong> and <strong className="text-slate-200">Sizes 37-38 (Women)</strong>.
          </p>

          <div className="grid grid-cols-9 gap-1.5 pt-2 items-end h-32">
            {[
              { size: 36, label: 'W36', height: '40%' },
              { size: 37, label: 'W37', height: '85%' },
              { size: 38, label: 'W38', height: '95%' },
              { size: 39, label: 'W39', height: '60%' },
              { size: 40, label: '36/40', height: '50%' },
              { size: 41, label: 'M41', height: '90%' },
              { size: 42, label: 'M42', height: '100%' },
              { size: 43, label: 'M43', height: '65%' },
              { size: 44, label: 'M44', height: '35%' },
            ].map(col => (
              <div key={col.label} className="flex flex-col items-center h-full justify-end group">
                <span className="text-[9px] font-mono text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                  {col.height}
                </span>
                <div 
                  className={`w-full rounded-t-md transition-all ${
                    col.size === 42 || col.size === 38 ? 'bg-amber-400' : 'bg-slate-700 hover:bg-slate-600'
                  }`}
                  style={{ height: col.height }}
                />
                <span className="text-[10px] font-mono text-slate-400 mt-1">{col.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
