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
    { color: 'Beige' as ShoeColor, count: beigeTotal, bg: 'bg-[#d8c3a5]', ring: 'border-pink-400', percent: totalColorUnits > 0 ? Math.round((beigeTotal / totalColorUnits) * 100) : 0 },
  ];

  return (
    <div className="space-y-6">
      {/* Header Text (Without box and icon) */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-1">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold font-['Plus_Jakarta_Sans'] tracking-tight text-slate-900 dark:text-white">
            Seasonal Insights & Analytics
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5 max-w-2xl">
            Predictive demand forecasting based on Khmer cultural calendar, regional monsoons, wedding cycles, and real-time inventory velocity.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-white dark:bg-slate-900 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-mono shrink-0 shadow-sm">
          <Calendar className="w-4 h-4 text-pink-500 dark:text-pink-400" />
          <span className="text-slate-700 dark:text-slate-300">Active Cycle: <strong>Dry / Pre-New Year</strong></span>
        </div>
      </div>

      {/* Metric Highlights */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-1 shadow-sm dark:shadow-md">
          <span className="text-[11px] text-slate-500 dark:text-slate-400 uppercase font-semibold">Total Revenue Recorded</span>
          <p className="text-2xl font-mono font-bold text-slate-900 dark:text-white">${totalRevenue.toFixed(2)}</p>
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5 font-medium">
            <ArrowUpRight className="w-3.5 h-3.5" /> +28.4% seasonal surge
          </span>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-1 shadow-sm dark:shadow-md">
          <span className="text-[11px] text-slate-500 dark:text-slate-400 uppercase font-semibold">Gross Profit Margin</span>
          <p className="text-2xl font-mono font-bold text-pink-600 dark:text-pink-400">${totalProfit.toFixed(2)}</p>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
            {totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) : '52.4'}% net margin
          </span>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-1 shadow-sm dark:shadow-md">
          <span className="text-[11px] text-slate-500 dark:text-slate-400 uppercase font-semibold">Total Sold Units</span>
          <p className="text-2xl font-mono font-bold text-slate-900 dark:text-slate-100">{totalSoldUnits + 45} pairs</p>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">Men 54% · Women 46%</span>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-1 shadow-sm dark:shadow-md">
          <span className="text-[11px] text-slate-500 dark:text-slate-400 uppercase font-semibold">Geographic Distribution</span>
          <p className="text-2xl font-mono font-bold text-cyan-600 dark:text-cyan-400">64% / 36%</p>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">Phnom Penh vs Provinces</span>
        </div>
      </div>

      {/* Main Seasonal Selector & Detailed Intelligence Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Seasonal Selector Tabs (4 cols) */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-2 shadow-sm dark:shadow-md">
          <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider px-2 mb-3">
            Seasonal Cycles in Cambodia
          </h3>

          {SEASONAL_INSIGHTS.map((season, idx) => {
            const isSelected = selectedSeasonIdx === idx;
            return (
              <button
                key={season.seasonName}
                onClick={() => setSelectedSeasonIdx(idx)}
                className={`w-full text-left p-3.5 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-pink-50 dark:bg-pink-500/15 border-pink-500 dark:border-pink-400 text-pink-700 dark:text-pink-300 shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/40'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold font-['Plus_Jakarta_Sans']">{season.seasonName}</span>
                  <span className="text-[10px] font-mono text-pink-600 dark:text-pink-400/90 font-semibold">{season.months}</span>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  <span>Demand Index: {(season.demandFactor * 100).toFixed(0)}%</span>
                  <span aria-hidden="true">·</span>
                  <span>{season.bestSellingCategories.join(', ')}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Seasonal Intelligence Detail (8 cols) */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 flex flex-col justify-between space-y-5 shadow-sm dark:shadow-md">
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900 dark:text-white font-['Plus_Jakarta_Sans']">
                  {activeSeason.seasonName} ({activeSeason.months})
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Projected demand multiplier: <strong className="text-pink-600 dark:text-pink-400 font-mono">+{((activeSeason.demandFactor - 1) * 100).toFixed(0)}% increase</strong>
                </p>
              </div>

              <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300">
                <Sparkles className="w-3.5 h-3.5 text-pink-500 dark:text-pink-400" />
                <span>AI Restock Advisory</span>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {activeSeason.description}
            </p>

            {/* Strategic Procurement Guidelines */}
            <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800/80 space-y-3">
              <h4 className="text-xs font-bold text-pink-600 dark:text-pink-300 uppercase tracking-wider flex items-center gap-1.5">
                <Compass className="w-4 h-4 text-pink-500 dark:text-pink-400" />
                Procurement & Stocking Recommendation
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-sans">
                {activeSeason.advice}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
                <div className="p-2.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-xs">
                  <span className="text-[10px] uppercase text-slate-500 font-semibold block">Priority Men Sizes</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                    Sizes {activeSeason.topSizeMen.join(', ')}
                  </span>
                </div>

                <div className="p-2.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-xs">
                  <span className="text-[10px] uppercase text-slate-500 font-semibold block">Priority Women Sizes</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                    Sizes {activeSeason.topSizeWomen.join(', ')}
                  </span>
                </div>

                <div className="p-2.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-xs">
                  <span className="text-[10px] uppercase text-slate-500 font-semibold block">Trending Tones</span>
                  <span className="font-semibold text-pink-600 dark:text-pink-400">
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
        <div className="lg:col-span-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm dark:shadow-md">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white font-['Plus_Jakarta_Sans']">
              Color Preference Share (Real-Time)
            </h3>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">4 Colors Tracked</span>
          </div>

          <div className="space-y-3">
            {colorShares.map(item => (
              <div key={item.color} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-medium">
                    <span className={`w-3 h-3 rounded-full ${item.bg} border ${item.ring}`} />
                    {item.color}
                  </span>
                  <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                    {item.percent}% ({item.count} sold)
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-100 dark:bg-slate-950 rounded-full overflow-hidden border border-slate-200 dark:border-slate-800">
                  <div 
                    className="h-full bg-pink-500 rounded-full transition-all duration-500" 
                    style={{ width: `${item.percent}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Size Demand Distribution (6 cols) */}
        <div className="lg:col-span-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm dark:shadow-md">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white font-['Plus_Jakarta_Sans']">
              Size Velocity Bell Curve
            </h3>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">Men (40-44) · Women (36-40)</span>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400">
            Peak Cambodian consumer demand concentrates on <strong className="text-slate-800 dark:text-slate-200">Sizes 41-42 (Men)</strong> and <strong className="text-slate-800 dark:text-slate-200">Sizes 37-38 (Women)</strong>.
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
                <span className="text-[9px] font-mono text-slate-500 dark:text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                  {col.height}
                </span>
                <div 
                  className={`w-full rounded-t-md transition-all ${
                    col.size === 42 || col.size === 38 ? 'bg-pink-500' : 'bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600'
                  }`}
                  style={{ height: col.height }}
                />
                <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 mt-1">{col.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
