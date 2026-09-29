import React, { useState } from 'react';
import { 
  Search, 
  ShoppingCart, 
  ShoppingBag, 
  Plus, 
  SlidersHorizontal, 
  Package, 
  Eye,
  ChevronDown,
  LayoutGrid,
  List,
  Check,
  ArrowRight,
  X
} from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { useTheme } from '../context/ThemeContext';
import { ShoeProduct, ShoeColor, ShoeGender } from '../types';
import { formatRiel } from '../utils/currency';

const ALL_COLORS: ShoeColor[] = ['Black', 'White', 'Navy', 'Beige'];

interface InventoryViewProps {
  onOpenProductDetail: (product: ShoeProduct) => void;
  onOpenSellModal?: (product?: ShoeProduct, size?: number, color?: ShoeColor) => void;
  onOpenCart?: (product?: ShoeProduct, size?: number, color?: ShoeColor) => void;
  onOpenAddModal: () => void;
}

export const COLOR_STYLES: Record<string, { bg: string; border: string; text: string }> = {
  Black: { bg: 'bg-black', border: 'border-slate-600', text: 'text-slate-200' },
  White: { bg: 'bg-white', border: 'border-slate-300', text: 'text-slate-900' },
  'ខ្មៅ': { bg: 'bg-black', border: 'border-slate-600', text: 'text-slate-200' },
  'ខៅ': { bg: 'bg-black', border: 'border-slate-600', text: 'text-slate-200' },
  'ស': { bg: 'bg-white', border: 'border-slate-300', text: 'text-slate-900' },
  Navy: { bg: 'bg-blue-600', border: 'border-blue-400', text: 'text-blue-200' },
  Beige: { bg: 'bg-[#d8c3a5]', border: 'border-pink-400', text: 'text-pink-950' }
};

export const getColorStyle = (colorName: string): { bg: string; border: string; text: string } => {
  if (!colorName) return { bg: 'bg-slate-700', border: 'border-slate-600', text: 'text-white' };
  const normalized = colorName.trim().toLowerCase();

  if (COLOR_STYLES[colorName]) return COLOR_STYLES[colorName];

  if (normalized === 'black' || normalized === 'ខ្មៅ' || normalized === 'ខៅ') {
    return { bg: 'bg-black', border: 'border-slate-600', text: 'text-white' };
  }
  if (normalized === 'white' || normalized === 'ស') {
    return { bg: 'bg-white', border: 'border-slate-300', text: 'text-slate-900' };
  }
  if (normalized === 'navy' || normalized === 'blue' || normalized === 'ខៀវ') {
    return { bg: 'bg-blue-600', border: 'border-blue-400', text: 'text-white' };
  }
  if (normalized === 'beige' || normalized === 'cream' || normalized === 'បន៍') {
    return { bg: 'bg-[#d8c3a5]', border: 'border-amber-400', text: 'text-amber-950' };
  }
  if (normalized === 'brown' || normalized === 'ត្នោត') {
    return { bg: 'bg-amber-800', border: 'border-amber-600', text: 'text-white' };
  }
  if (normalized === 'red' || normalized === 'ក្រហម') {
    return { bg: 'bg-rose-600', border: 'border-rose-400', text: 'text-white' };
  }
  if (normalized === 'green' || normalized === 'បៃតង') {
    return { bg: 'bg-emerald-600', border: 'border-emerald-400', text: 'text-white' };
  }
  if (normalized === 'grey' || normalized === 'gray' || normalized === 'ប្រផេះ') {
    return { bg: 'bg-slate-500', border: 'border-slate-400', text: 'text-white' };
  }
  if (normalized === 'pink' || normalized === 'ផ្កាឈូក') {
    return { bg: 'bg-pink-500', border: 'border-pink-300', text: 'text-white' };
  }
  if (normalized === 'yellow' || normalized === 'gold' || normalized === 'លឿង') {
    return { bg: 'bg-amber-400', border: 'border-amber-300', text: 'text-slate-950' };
  }

  return { bg: 'bg-pink-500', border: 'border-pink-400', text: 'text-white' };
};

// ==========================================
// Product Grid Card Component
// ==========================================
const ProductGridCard: React.FC<{
  product: ShoeProduct;
  onOpenProductDetail: (product: ShoeProduct) => void;
  onOpenCart?: (product?: ShoeProduct, size?: number, color?: ShoeColor) => void;
}> = ({ product, onOpenProductDetail }) => {
  const { addToCart } = useInventory();
  const colors = Array.from(new Set(product.variants.map(v => v.color))) as ShoeColor[];
  const [selectedColor, setSelectedColor] = useState<ShoeColor>(colors[0] || 'Black');
  const sizes = Array.from(new Set(product.variants.map(v => v.size))).sort((a, b) => a - b);

  // Default size: first size that is in-stock for selected color, or first size
  const defaultSize = product.variants.find(v => v.color === (colors[0] || 'Black') && v.stock > 0)?.size ?? sizes[0] ?? null;
  const [selectedSize, setSelectedSize] = useState<number | null>(defaultSize);
  const [addedSuccess, setAddedSuccess] = useState(false);

  // Switch color safely
  const handleColorChange = (newColor: ShoeColor) => {
    setSelectedColor(newColor);
    const currentSizeInStock = product.variants.some(v => v.color === newColor && v.size === selectedSize && v.stock > 0);
    if (!currentSizeInStock) {
      const firstInStock = product.variants.find(v => v.color === newColor && v.stock > 0);
      if (firstInStock) {
        setSelectedSize(firstInStock.size);
      }
    }
  };

  // Filtered stock based on selected color
  const displayedStock = product.variants
    .filter(v => v.color === selectedColor)
    .reduce((sum, v) => sum + v.stock, 0);

  // Total stock across all colors
  const totalAllColorsStock = product.variants.reduce((sum, v) => sum + v.stock, 0);

  // Stock for specifically selected size & color
  const selectedVariantStock = product.variants.find(
    v => v.color === selectedColor && v.size === selectedSize
  )?.stock || 0;

  // Clicking size button ONLY selects the size (does not auto-add to cart)
  const handleSizeSelect = (size: number) => {
    setSelectedSize(size);
  };

  // User explicitly clicks "Add to Cart"
  const handleAddToCart = () => {
    if (!selectedSize || selectedVariantStock === 0) return;
    const res = addToCart(product, selectedSize, selectedColor, 1);
    if (res.success) {
      setAddedSuccess(true);
      setTimeout(() => setAddedSuccess(false), 1400);
    } else if (res.message) {
      alert(res.message);
    }
  };

  const isColorOutOfStock = displayedStock === 0;
  const isProductOutOfStock = totalAllColorsStock === 0;

  // Picture corresponding to selected colorway
  const activeImage = (product.colorImages?.[selectedColor])
    ? product.colorImages[selectedColor]!
    : (product.images[0] || '');

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-pink-300 dark:hover:border-slate-700 rounded-2xl overflow-hidden flex flex-col justify-between transition-all duration-200 group shadow-sm dark:shadow-lg">
      {/* Top Image Container */}
      <div className="relative w-full h-56 bg-slate-100 dark:bg-slate-950 overflow-hidden flex items-center justify-center">
        {activeImage ? (
          <img
            key={activeImage}
            src={activeImage}
            alt={`${product.name} ${selectedColor}`}
            className="w-full h-full object-cover group-hover:scale-105 transition-all duration-300 animate-in fade-in"
            referrerPolicy="no-referrer"
          />
        ) : (
          <Package className="w-12 h-12 text-slate-400 dark:text-slate-700" />
        )}

        {/* Subtle Top Metadata */}
        <div className="absolute top-3 left-3 bg-white/90 dark:bg-slate-950/85 backdrop-blur-sm px-2.5 py-1 rounded-md text-[10px] text-slate-800 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5 border border-slate-200 dark:border-slate-800/80 shadow-sm">
          <span className="font-bold text-pink-600 dark:text-pink-300">SKU: {product.sku}</span>
        </div>

        {/* Color Badge */}
        <div className="absolute bottom-3 left-3 bg-white/95 dark:bg-slate-950/90 border border-pink-400/50 backdrop-blur-md px-2.5 py-1 rounded-lg text-[11px] font-bold text-pink-700 dark:text-pink-300 flex items-center gap-1.5 shadow-sm">
          <span className={`w-2.5 h-2.5 rounded-full ${getColorStyle(selectedColor).bg} ${getColorStyle(selectedColor).border} border ring-1 ring-black/20`} />
          <span>{selectedColor} Colorway</span>
        </div>

        {/* Out of Stock Label */}
        {isProductOutOfStock ? (
          <div className="absolute top-3 right-3 bg-rose-950/90 text-rose-300 border border-rose-800/80 px-2.5 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase">
            Out of Stock
          </div>
        ) : isColorOutOfStock ? (
          <div className="absolute top-3 right-3 bg-rose-950/90 text-rose-300 border border-rose-800/80 px-2.5 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase">
            {selectedColor} Out of Stock
          </div>
        ) : null}
      </div>

      {/* Card Content */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div>
          {/* Name & Pricing */}
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-[10px] font-bold text-pink-600 dark:text-pink-300 bg-pink-50 dark:bg-pink-500/10 px-1.5 py-0.5 rounded border border-pink-200 dark:border-pink-500/20">
                  {product.sku}
                </span>
              </div>
              <h3 className="font-extrabold text-lg sm:text-xl text-slate-900 dark:text-white leading-tight line-clamp-2" title={product.name}>
                {product.name}
              </h3>
              <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Total in Stock:</span>
                <span className="text-[11px] font-bold text-pink-600 dark:text-pink-300 bg-pink-50 dark:bg-pink-500/10 px-2 py-0.5 rounded border border-pink-200 dark:border-pink-500/25">
                  {totalAllColorsStock} pairs (All Colors)
                </span>
              </div>
            </div>
            <div className="text-right shrink-0">
              <span className="text-base font-bold text-pink-600 dark:text-pink-400">
                {formatRiel(product.retailPrice)}
              </span>
            </div>
          </div>

          {/* Sizes in Stock & Color Selection Box */}
          <div className="mt-3.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 rounded-xl p-3 space-y-2.5">
            {/* Color selector section */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Color:</span>
                <span className="text-[11px] font-bold text-pink-600 dark:text-pink-400">
                  {displayedStock} {displayedStock === 1 ? 'pair' : 'pairs'}
                </span>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {colors.map(color => {
                  const isSelected = selectedColor === color;
                  const colorTotal = product.variants
                    .filter(v => v.color === color)
                    .reduce((sum, v) => sum + v.stock, 0);
                  const style = getColorStyle(color);
                  const customHex = product.colorHexes?.[color];

                  return (
                    <button
                      key={color}
                      type="button"
                      onClick={() => handleColorChange(color)}
                      className={`flex items-center gap-2 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs sm:text-sm font-bold transition-all border cursor-pointer active:scale-95 shadow-sm ${
                        isSelected
                          ? 'bg-pink-50 dark:bg-pink-500/25 border-pink-400 text-pink-700 dark:text-pink-200 ring-2 ring-pink-400/50 shadow-md scale-[1.03]'
                          : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700/80 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:border-slate-400 dark:hover:border-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                      title={`Select ${color} (${colorTotal} pairs)`}
                    >
                      {customHex ? (
                        <span 
                          className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full border border-white/30 shadow-sm shrink-0" 
                          style={{ backgroundColor: customHex }}
                        />
                      ) : (
                        <span className={`w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full ${style.bg} ${style.border} border ring-1 ring-black/30 shadow-sm shrink-0`} />
                      )}
                      <span className="leading-tight">{color}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Size Tiles */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                <span>Select Size:</span>
                {selectedSize ? (
                  <span className={`text-[11px] font-bold ${selectedVariantStock > 0 ? 'text-pink-600 dark:text-pink-400' : 'text-rose-500 dark:text-rose-400'}`}>
                    {selectedVariantStock > 0 ? `${selectedVariantStock} ${selectedVariantStock === 1 ? 'pair' : 'pairs'} in stock` : 'Out of stock'}
                  </span>
                ) : (
                  <span className="text-slate-400 dark:text-slate-500 text-[10px]">Choose a size</span>
                )}
              </div>

              <div className="grid grid-cols-5 gap-1.5 text-center">
                {sizes.map(size => {
                  const totalForSize = product.variants
                    .filter(v => v.size === size && v.color === selectedColor)
                    .reduce((sum, v) => sum + v.stock, 0);
                  const isOut = totalForSize === 0;
                  const isSelected = selectedSize === size;

                  return (
                    <button
                      key={size}
                      type="button"
                      disabled={isOut}
                      onClick={() => {
                        if (!isOut) {
                          handleSizeSelect(size);
                        }
                      }}
                      className={`py-1.5 px-1 rounded-lg border transition-all flex flex-col items-center justify-center relative ${
                        isSelected
                          ? 'bg-pink-50 dark:bg-pink-500/25 border-pink-400 text-pink-700 dark:text-pink-200 ring-2 ring-pink-400/50 shadow-md font-bold scale-[1.03]'
                          : isOut 
                          ? 'bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/40 text-rose-400 cursor-not-allowed opacity-50' 
                          : 'bg-white dark:bg-slate-900/90 border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-white shadow-sm cursor-pointer active:scale-95'
                      }`}
                      title={`Size ${size} (${selectedColor}): ${isOut ? 'Out of Stock' : `${totalForSize} pairs available. Click to select size.`}`}
                    >
                      <span className={`text-xs font-bold flex items-center gap-0.5 ${
                        isSelected 
                          ? 'text-pink-600 dark:text-pink-300' 
                          : isOut 
                          ? 'text-rose-400 dark:text-rose-300/70 line-through' 
                          : 'text-slate-800 dark:text-slate-100'
                      }`}>
                        {size}
                      </span>
                      <span className={`text-[9px] uppercase tracking-wider mt-0.5 font-medium ${
                        isSelected
                          ? 'text-pink-600 dark:text-pink-400 font-bold'
                          : isOut ? 'text-rose-500 dark:text-rose-400' : 'text-slate-500 dark:text-slate-400'
                      }`}>
                        {isOut ? 'Out' : `${totalForSize} left`}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Actions: Inspect & Add to Cart */}
        <div className="pt-3 border-t border-slate-200 dark:border-slate-800/80 flex items-center gap-2">
          <button
            type="button"
            onClick={() => onOpenProductDetail(product)}
            className="py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/70 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
          >
            <Eye className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            <span>Details</span>
          </button>

          <button
            type="button"
            onClick={handleAddToCart}
            disabled={!selectedSize || selectedVariantStock === 0 || displayedStock === 0}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer ${
              addedSuccess
                ? 'bg-emerald-500 text-white shadow-emerald-500/20'
                : 'bg-pink-500 hover:bg-pink-400 disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 dark:disabled:text-slate-600 text-white shadow-pink-500/10'
            }`}
            title={
              displayedStock === 0
                ? 'Out of stock'
                : !selectedSize
                ? 'Select a size first'
                : `Add Size ${selectedSize} (${selectedColor}) to cart`
            }
          >
            {addedSuccess ? (
              <>
                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Added to Cart!</span>
              </>
            ) : (
              <>
                <ShoppingCart className="w-3.5 h-3.5" />
                <span>Add to Cart</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// Product List Card Component
// ==========================================
const ProductListCard: React.FC<{
  product: ShoeProduct;
  onOpenProductDetail: (product: ShoeProduct) => void;
  onOpenCart?: (product?: ShoeProduct, size?: number, color?: ShoeColor) => void;
}> = ({ product, onOpenProductDetail }) => {
  const { addToCart } = useInventory();
  const colors = Array.from(new Set(product.variants.map(v => v.color))) as ShoeColor[];
  const [selectedColor, setSelectedColor] = useState<ShoeColor>(colors[0] || 'Black');
  const sizes = Array.from(new Set(product.variants.map(v => v.size))).sort((a, b) => a - b);

  const defaultSize = product.variants.find(v => v.color === (colors[0] || 'Black') && v.stock > 0)?.size ?? sizes[0] ?? null;
  const [selectedSize, setSelectedSize] = useState<number | null>(defaultSize);
  const [addedSuccess, setAddedSuccess] = useState(false);

  const handleColorChange = (newColor: ShoeColor) => {
    setSelectedColor(newColor);
    const currentSizeInStock = product.variants.some(v => v.color === newColor && v.size === selectedSize && v.stock > 0);
    if (!currentSizeInStock) {
      const firstInStock = product.variants.find(v => v.color === newColor && v.stock > 0);
      if (firstInStock) {
        setSelectedSize(firstInStock.size);
      }
    }
  };

  const displayedStock = product.variants
    .filter(v => v.color === selectedColor)
    .reduce((sum, v) => sum + v.stock, 0);

  const totalAllColorsStock = product.variants.reduce((sum, v) => sum + v.stock, 0);

  const selectedVariantStock = product.variants.find(
    v => v.color === selectedColor && v.size === selectedSize
  )?.stock || 0;

  const handleSizeSelect = (size: number) => {
    setSelectedSize(size);
  };

  const handleAddToCart = () => {
    if (!selectedSize || selectedVariantStock === 0) return;
    const res = addToCart(product, selectedSize, selectedColor, 1);
    if (res.success) {
      setAddedSuccess(true);
      setTimeout(() => setAddedSuccess(false), 1400);
    } else if (res.message) {
      alert(res.message);
    }
  };

  const isProductOutOfStock = totalAllColorsStock === 0;

  // Picture corresponding to selected colorway
  const activeImage = (product.colorImages?.[selectedColor])
    ? product.colorImages[selectedColor]!
    : (product.images[0] || '');

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-pink-300 dark:hover:border-slate-700 rounded-2xl p-3.5 sm:p-4 transition-all duration-200 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3.5 sm:gap-4 shadow-sm dark:shadow-lg group min-w-0 w-full">
      {/* 1. Left: Product Identity & Price */}
      <div className="flex items-start gap-3.5 min-w-0 lg:w-80 lg:shrink-0">
        <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-slate-100 dark:bg-slate-950 overflow-hidden shrink-0 border border-slate-200 dark:border-slate-800/80 group-hover:border-slate-300 dark:group-hover:border-slate-700 flex items-center justify-center self-start">
          {activeImage ? (
            <img
              key={activeImage}
              src={activeImage}
              alt={`${product.name} ${selectedColor}`}
              className="w-full h-full object-cover group-hover:scale-105 transition-all duration-300 animate-in fade-in"
              referrerPolicy="no-referrer"
            />
          ) : (
            <Package className="w-7 h-7 text-slate-400 dark:text-slate-700" />
          )}
        </div>

        <div className="min-w-0 flex-1 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-1.5 mb-1">
              <span className="text-[10px] font-bold text-pink-600 dark:text-pink-300 bg-pink-50 dark:bg-pink-500/10 px-2 py-0.5 rounded border border-pink-200 dark:border-pink-500/25">
                SKU: {product.sku}
              </span>
              <span className="font-bold text-pink-600 dark:text-pink-400 text-sm">
                {formatRiel(product.retailPrice)}
              </span>
            </div>

            <h3 className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-white leading-snug line-clamp-2" title={product.name}>
              {product.name}
            </h3>
          </div>

          <div className="flex items-center gap-1.5 mt-1.5">
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
              {totalAllColorsStock} pairs total
            </span>
            {isProductOutOfStock && (
              <span className="text-[9px] font-bold text-rose-500 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-200 dark:border-rose-500/20 uppercase tracking-wider">
                Out of Stock
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 2. Middle: Clean Unified Sizes & Color Deck (Matching Grid View) */}
      <div className="flex-1 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 rounded-xl p-3 space-y-2.5 min-w-0">
        {/* Color selector section */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Color:</span>
            <span className="text-[11px] font-bold text-pink-600 dark:text-pink-400">
              {displayedStock} {displayedStock === 1 ? 'pair' : 'pairs'}
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {colors.map(color => {
              const isSelected = selectedColor === color;
              const colorStock = product.variants
                .filter(v => v.color === color)
                .reduce((sum, v) => sum + v.stock, 0);
              const style = getColorStyle(color);

              return (
                <button
                  key={color}
                  type="button"
                  onClick={() => handleColorChange(color)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer active:scale-95 shadow-sm ${
                    isSelected
                      ? 'bg-pink-50 dark:bg-pink-500/25 border-pink-400 text-pink-700 dark:text-pink-200 ring-2 ring-pink-400/50 shadow-md scale-[1.03]'
                      : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700/80 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:border-slate-400 dark:hover:border-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                  title={`Select ${color} (${colorStock} pairs)`}
                >
                  <span className={`w-3.5 h-3.5 rounded-full ${style.bg} ${style.border} border ring-1 ring-black/30 shadow-sm shrink-0`} />
                  <span className="leading-tight">{color}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Size Tiles */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            <span>Select Size:</span>
            {selectedSize ? (
              <span className={`text-[11px] font-bold ${selectedVariantStock > 0 ? 'text-pink-600 dark:text-pink-400' : 'text-rose-500 dark:text-rose-400'}`}>
                {selectedVariantStock > 0 ? `${selectedVariantStock} ${selectedVariantStock === 1 ? 'pair' : 'pairs'} in stock` : 'Out of stock'}
              </span>
            ) : (
              <span className="text-slate-400 dark:text-slate-500 text-[10px]">Choose a size</span>
            )}
          </div>

          <div className="grid grid-cols-5 gap-1.5 text-center">
            {sizes.map(size => {
              const totalForSize = product.variants
                .filter(v => v.size === size && v.color === selectedColor)
                .reduce((sum, v) => sum + v.stock, 0);
              const isOut = totalForSize === 0;
              const isSelected = selectedSize === size;

              return (
                <button
                  key={size}
                  type="button"
                  disabled={isOut}
                  onClick={() => {
                    if (!isOut) {
                      handleSizeSelect(size);
                    }
                  }}
                  className={`py-1.5 px-1 rounded-lg border transition-all flex flex-col items-center justify-center relative ${
                    isSelected
                      ? 'bg-pink-50 dark:bg-pink-500/25 border-pink-400 text-pink-700 dark:text-pink-200 ring-2 ring-pink-400/50 shadow-md font-bold scale-[1.03]'
                      : isOut 
                      ? 'bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/40 text-rose-400 cursor-not-allowed opacity-50' 
                      : 'bg-white dark:bg-slate-900/90 border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-white shadow-sm cursor-pointer active:scale-95'
                  }`}
                  title={`Size ${size} (${selectedColor}): ${isOut ? 'Out of Stock' : `${totalForSize} pairs available. Click to select size.`}`}
                >
                  <span className={`text-xs font-bold flex items-center gap-0.5 ${
                    isSelected 
                      ? 'text-pink-600 dark:text-pink-300' 
                      : isOut 
                      ? 'text-rose-400 dark:text-rose-300/70 line-through' 
                      : 'text-slate-800 dark:text-slate-200'
                  }`}>
                    {size}
                  </span>
                  <span className={`text-[9px] uppercase tracking-wider mt-0.5 font-medium ${
                    isSelected 
                      ? 'text-pink-600 dark:text-pink-300 font-bold' 
                      : isOut 
                      ? 'text-rose-500 dark:text-rose-400 font-medium' 
                      : totalForSize <= 2 
                      ? 'text-pink-600 dark:text-pink-400 font-medium' 
                      : 'text-slate-500 dark:text-slate-400'
                  }`}>
                    {isOut ? 'OUT' : `${totalForSize} LEFT`}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3. Right: Clean Action Buttons */}
      <div className="flex items-center gap-2.5 shrink-0 justify-end w-full lg:w-auto pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-200 dark:border-slate-800/60">
        <button
          type="button"
          onClick={() => onOpenProductDetail(product)}
          className="flex-1 lg:flex-initial py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap shadow-sm cursor-pointer"
        >
          <Eye className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
          <span>Details</span>
        </button>

        <button
          type="button"
          onClick={handleAddToCart}
          disabled={!selectedSize || selectedVariantStock === 0 || displayedStock === 0}
          className={`flex-1 lg:flex-initial py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-md whitespace-nowrap active:scale-95 cursor-pointer ${
            addedSuccess
              ? 'bg-emerald-500 text-white shadow-emerald-500/20'
              : 'bg-pink-500 hover:bg-pink-400 disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 dark:disabled:text-slate-600 text-white shadow-pink-500/10'
          }`}
          title={
            displayedStock === 0
              ? 'Out of stock'
              : !selectedSize
              ? 'Select a size first'
              : 'Add to cart'
          }
        >
          {addedSuccess ? (
            <>
              <Check className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Added to Cart!</span>
            </>
          ) : (
            <>
              <ShoppingCart className="w-3.5 h-3.5" />
              <span>Add to Cart</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

// ==========================================
// Main Inventory View
// ==========================================
export const InventoryView: React.FC<InventoryViewProps> = ({
  onOpenProductDetail,
  onOpenSellModal,
  onOpenCart,
  onOpenAddModal
}) => {
  const { products, categories: registeredCategories, cart, totalCartItems, totalCartAmount } = useInventory();
  const handleOpenCartModal = (product?: ShoeProduct, size?: number, color?: ShoeColor) => {
    if (onOpenCart) {
      onOpenCart(product, size, color);
    } else if (onOpenSellModal) {
      onOpenSellModal(product, size, color);
    }
  };

  // View Display Options: Grid or List
  const [displayMode, setDisplayMode] = useState<'grid' | 'list'>('grid');

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedGender, setSelectedGender] = useState<'all' | ShoeGender>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedColor, setSelectedColor] = useState<'all' | ShoeColor>('all');
  const [selectedSize, setSelectedSize] = useState<'all' | string>('all');

  // Active filter count (excluding raw search query)
  const activeDropdownFiltersCount = [
    selectedGender !== 'all',
    selectedCategory !== 'all',
    selectedColor !== 'all',
    selectedSize !== 'all'
  ].filter(Boolean).length;

  // Filter application
  const filteredProducts = products.filter(product => {
    // 1. Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = product.name.toLowerCase().includes(q);
      const matchSku = product.sku.toLowerCase().includes(q);
      const matchTags = product.tags.some(t => t.toLowerCase().includes(q));
      const matchCategory = product.category.toLowerCase().includes(q);
      const matchMaterial = product.specifications?.upperMaterial?.toLowerCase().includes(q);
      if (!matchName && !matchSku && !matchTags && !matchCategory && !matchMaterial) return false;
    }

    // 2. Gender
    if (selectedGender !== 'all' && product.gender !== selectedGender) {
      return false;
    }

    // 3. Category
    if (selectedCategory !== 'all' && product.category !== selectedCategory) {
      return false;
    }

    // 4. Color Preference filter
    if (selectedColor !== 'all') {
      const hasMatchingColor = product.variants.some(
        v => v.color === selectedColor && v.stock > 0
      );
      if (!hasMatchingColor) return false;
    }

    // 5. Size Preference filter
    if (selectedSize !== 'all') {
      const sizeNum = parseInt(selectedSize, 10);
      const hasMatchingSize = product.variants.some(
        v => v.size === sizeNum && v.stock > 0
      );
      if (!hasMatchingSize) return false;
    }

    return true;
  });

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedGender('all');
    setSelectedCategory('all');
    setSelectedColor('all');
    setSelectedSize('all');
  };

  const hasActiveFilters = 
    searchQuery.trim() !== '' || 
    selectedGender !== 'all' || 
    selectedCategory !== 'all' || 
    selectedColor !== 'all' || 
    selectedSize !== 'all';

  return (
    <div className="space-y-6">
      {/* Header Text (Without box and icon) */}
      <div className="pb-1">
        <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white font-['Plus_Jakarta_Sans'] tracking-tight">
          Stock & Catalog
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          Real-time multi-variant inventory across sizes, styles, and colorways.
        </p>
      </div>

      {/* Results Header, Search Box, Category Pills & Actions Bar */}
      <div className="space-y-3 px-1">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Shoe models count */}
          <div className="flex items-center gap-2 text-xs shrink-0">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              {filteredProducts.length} shoe models
            </span>
            <span aria-hidden="true" className="text-slate-300 dark:text-slate-600">·</span>
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
              {filteredProducts.reduce((sum, p) => sum + p.totalStock, 0)} total pairs in warehouse
            </span>
          </div>

          {/* Right Controls: Add New on the left, and Filter + Search + View toggle grouped cleanly on the right */}
          <div className="flex items-center justify-between gap-2 sm:gap-2.5 w-full lg:w-auto min-w-0">
            {/* Add New Product Button */}
            <button
              type="button"
              onClick={onOpenAddModal}
              className="h-9 flex items-center justify-center gap-1.5 px-3.5 bg-pink-500 hover:bg-pink-400 text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-pink-500/20 active:scale-95 shrink-0 cursor-pointer"
              title="Register new footwear product"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              <span>Add New</span>
            </button>

            {/* Search, Filter, and Grid/List Controls Group */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 min-w-0">
              {/* Search Function: Mobile version shows only icon; Desktop & Tablet shows full input */}
              {/* Mobile Search Icon Button */}
              <button
                type="button"
                onClick={() => setIsMobileSearchOpen(prev => !prev)}
                className={`sm:hidden h-9 w-9 flex items-center justify-center rounded-xl border transition-all cursor-pointer relative shrink-0 ${
                  isMobileSearchOpen || searchQuery
                    ? 'bg-pink-50 dark:bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-300 dark:border-pink-500/40 shadow-xs'
                    : 'bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 shadow-sm'
                }`}
                title={isMobileSearchOpen ? 'Close search' : 'Search shoe model, SKU...'}
                aria-label="Search"
              >
                <Search className="w-4 h-4" />
                {searchQuery && !isMobileSearchOpen && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-pink-500 rounded-full ring-2 ring-white dark:ring-slate-950" />
                )}
              </button>

              {/* Desktop & Tablet Search Input Box */}
              <div className="hidden sm:block relative sm:w-40 md:w-52 lg:w-64 xl:w-72 shrink-0 min-w-0">
                <Search className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search shoe model, SKU..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-9 w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-8.5 pr-7 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition-colors shadow-sm"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 cursor-pointer"
                    title="Clear search"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Toggle Filter Button with Down Arrow (Positioned to the right of Search) */}
              <button
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                className={`h-9 px-2.5 sm:px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shrink-0 border cursor-pointer ${
                  showFilters || activeDropdownFiltersCount > 0
                    ? 'bg-pink-50 dark:bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-200 dark:border-pink-500/30 shadow-sm'
                    : 'bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 shadow-sm'
                }`}
                title={showFilters ? 'Hide filters' : 'Show filters'}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Filters</span>
                {activeDropdownFiltersCount > 0 && (
                  <span className="w-4 h-4 rounded-full bg-pink-500 text-white font-black text-[10px] flex items-center justify-center">
                    {activeDropdownFiltersCount}
                  </span>
                )}
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${showFilters ? 'rotate-180 text-pink-500 dark:text-pink-400' : 'text-slate-400'}`} />
              </button>

              {/* Clear Filters Button (Visible when filters applied) */}
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="h-9 px-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 transition-colors shrink-0 cursor-pointer"
                  title="Reset all filters"
                >
                  <span>Reset</span>
                </button>
              )}

              {/* 2 View Options Toggle (Grid & List) */}
              <div className="h-9 flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-0.5 gap-0.5 shrink-0 shadow-sm">
                <button
                  type="button"
                  onClick={() => setDisplayMode('grid')}
                  className={`h-7.5 w-7.5 flex items-center justify-center rounded-lg transition-all cursor-pointer ${
                    displayMode === 'grid'
                      ? 'bg-pink-500 text-white shadow-sm'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                  }`}
                  title="Grid View"
                  aria-label="Grid View"
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setDisplayMode('list')}
                  className={`h-7.5 w-7.5 flex items-center justify-center rounded-lg transition-all cursor-pointer ${
                    displayMode === 'list'
                      ? 'bg-pink-500 text-white shadow-sm'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                  }`}
                  title="List View"
                  aria-label="List View"
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Search Input Drawer (Visible on Mobile when Search icon is tapped) */}
        {isMobileSearchOpen && (
          <div className="sm:hidden flex items-center gap-2 pt-1 animate-in fade-in slide-in-from-top-1 duration-150">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                autoFocus
                type="text"
                placeholder="Search shoe model, SKU..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-pink-400 dark:border-pink-500/50 rounded-xl pl-8.5 pr-8 py-2 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition-colors shadow-sm"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 cursor-pointer"
                  title="Clear search"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={() => setIsMobileSearchOpen(false)}
              className="px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl shrink-0 cursor-pointer transition-colors"
            >
              Done
            </button>
          </div>
        )}

        {/* Dropdown Select Boxes (Gender, Category, Color, Size) when expanded */}
        {showFilters && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm dark:shadow-md animate-in fade-in slide-in-from-top-1 duration-200">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              
              {/* Gender Select Box */}
              <div className="relative">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                  Gender / Department
                </label>
                <div className="relative">
                  <select
                    value={selectedGender}
                    onChange={(e) => setSelectedGender(e.target.value as any)}
                    className="w-full appearance-none bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-xl px-3.5 py-2.5 pr-9 focus:outline-none focus:border-pink-500 cursor-pointer transition-colors"
                  >
                    <option value="all">All Footwear (Men & Women)</option>
                    <option value="Men">Men&apos;s Footwear (Sizes 40 - 44)</option>
                    <option value="Women">Women&apos;s Footwear (Sizes 36 - 40)</option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {/* Footwear Category Select Box */}
              <div className="relative">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                  Footwear Category
                </label>
                <div className="relative">
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full appearance-none bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-xl px-3.5 py-2.5 pr-9 focus:outline-none focus:border-pink-500 cursor-pointer transition-colors"
                  >
                    <option value="all">
                      {registeredCategories.length === 0 ? 'All Categories (None Registered)' : 'All Categories'}
                    </option>
                    {registeredCategories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {/* Color Preference Select Box */}
              <div className="relative">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                  Color Preference
                </label>
                <div className="relative">
                  <select
                    value={selectedColor}
                    onChange={(e) => setSelectedColor(e.target.value as any)}
                    className="w-full appearance-none bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-xl px-3.5 py-2.5 pr-9 focus:outline-none focus:border-pink-500 cursor-pointer transition-colors"
                  >
                    <option value="all">All Colors</option>
                    {ALL_COLORS.map(c => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {/* Specific Size Select Box */}
              <div className="relative">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                  Specific Size
                </label>
                <div className="relative">
                  <select
                    value={selectedSize}
                    onChange={(e) => setSelectedSize(e.target.value)}
                    className="w-full appearance-none bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-xl px-3.5 py-2.5 pr-9 focus:outline-none focus:border-pink-500 cursor-pointer transition-colors"
                  >
                    <option value="all">All Sizes</option>
                    {[36, 37, 38, 39, 40, 41, 42, 43, 44].map(s => {
                      const label = s <= 39 ? `Size ${s} (Women's)` : s === 40 ? `Size ${s} (Men's & Women's)` : `Size ${s} (Men's)`;
                      return (
                        <option key={s} value={s.toString()}>
                          {label}
                        </option>
                      );
                    })}
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

            </div>
          </div>
        )}

        {/* Category Pills horizontal bar below shoe models count */}
        {registeredCategories.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            <button
              type="button"
              onClick={() => setSelectedCategory('all')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                selectedCategory === 'all'
                  ? 'bg-pink-500 text-white shadow-md shadow-pink-500/20 font-extrabold'
                  : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-sm'
              }`}
            >
              All Categories
            </button>
            {registeredCategories.map(cat => {
              const isSelected = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                    isSelected
                      ? 'bg-pink-500 text-white shadow-md shadow-pink-500/20 font-extrabold'
                      : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-sm'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* View 1: Card Grid View */}
      {displayMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.length === 0 ? (
            <div className="col-span-full py-24 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 space-y-4 shadow-sm dark:shadow-none">
              <div className="w-16 h-16 rounded-2xl bg-pink-50 dark:bg-pink-500/10 border border-pink-200 dark:border-pink-500/20 text-pink-600 dark:text-pink-400 flex items-center justify-center mx-auto">
                <Package className="w-8 h-8 stroke-1" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900 dark:text-white font-['Plus_Jakarta_Sans']">No Footwear in Inventory</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                  Your shoe catalog is ready for products. Add your shoe models, photos, and colorways with size stock.
                </p>
              </div>
              <button
                type="button"
                onClick={onOpenAddModal}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-pink-500 to-pink-400 hover:from-pink-400 hover:to-pink-300 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-pink-500/20 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Your First Shoe Product</span>
              </button>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="col-span-full py-20 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 shadow-sm dark:shadow-none">
              <Package className="w-12 h-12 text-slate-400 dark:text-slate-600 mx-auto mb-3 stroke-1" />
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-300">No Shoes Match Selected Filters</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Try removing some size, color, or category restrictions to view matching footwear models.
              </p>
              <button
                type="button"
                onClick={clearFilters}
                className="mt-4 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Clear All Filters
              </button>
            </div>
          ) : (
            filteredProducts.map(product => (
              <ProductGridCard
                key={product.id}
                product={product}
                onOpenProductDetail={onOpenProductDetail}
                onOpenCart={handleOpenCartModal}
              />
            ))
          )}
        </div>
      )}

      {/* View 2: Compact List View */}
      {displayMode === 'list' && (
        <div className="space-y-3">
          {products.length === 0 ? (
            <div className="py-24 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 space-y-4 shadow-sm dark:shadow-none">
              <div className="w-16 h-16 rounded-2xl bg-pink-50 dark:bg-pink-500/10 border border-pink-200 dark:border-pink-500/20 text-pink-600 dark:text-pink-400 flex items-center justify-center mx-auto">
                <Package className="w-8 h-8 stroke-1" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900 dark:text-white font-['Plus_Jakarta_Sans']">No Footwear in Inventory</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                  Your shoe catalog is ready for products. Add your shoe models, photos, and colorways with size stock.
                </p>
              </div>
              <button
                type="button"
                onClick={onOpenAddModal}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-pink-500 to-pink-400 hover:from-pink-400 hover:to-pink-300 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-pink-500/20 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Your First Shoe Product</span>
              </button>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="py-20 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 shadow-sm dark:shadow-none">
              <Package className="w-12 h-12 text-slate-400 dark:text-slate-600 mx-auto mb-3 stroke-1" />
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-300">No Shoes Match Selected Filters</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Try removing some size, color, or category restrictions to view matching footwear models.
              </p>
              <button
                type="button"
                onClick={clearFilters}
                className="mt-4 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Clear All Filters
              </button>
            </div>
          ) : (
            filteredProducts.map(product => (
              <ProductListCard
                key={product.id}
                product={product}
                onOpenProductDetail={onOpenProductDetail}
                onOpenCart={handleOpenCartModal}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
};
