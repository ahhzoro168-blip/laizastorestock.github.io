import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  ZoomIn, 
  ChevronLeft, 
  ChevronRight, 
  Package, 
  Trash2,
  Sliders,
  AlertTriangle,
  Save,
  Check,
  ShoppingCart
} from 'lucide-react';
import { ShoeProduct, ShoeColor, ShoeGender, ShoeCategory } from '../types';
import { useInventory } from '../context/InventoryContext';

interface ProductDetailModalProps {
  product: ShoeProduct | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenSellModal?: (product: ShoeProduct, size?: number, color?: ShoeColor) => void;
}

const CATEGORIES: ShoeCategory[] = [
  'Sneakers',
  'Formal & Loafers',
  'Running & Athletic',
  'Boots & Outdoor',
  'Casual & Lifestyle'
];

const COLOR_STYLES: Record<string, { bg: string; ring: string; text: string; border: string }> = {
  Black: { bg: 'bg-slate-900', ring: 'ring-slate-400', text: 'text-slate-100', border: 'border-slate-700' },
  White: { bg: 'bg-slate-100', ring: 'ring-slate-300', text: 'text-slate-900', border: 'border-slate-300' },
  'ខ្មៅ': { bg: 'bg-slate-900', ring: 'ring-slate-400', text: 'text-slate-100', border: 'border-slate-700' },
  'ស': { bg: 'bg-slate-100', ring: 'ring-slate-300', text: 'text-slate-900', border: 'border-slate-300' },
  Navy: { bg: 'bg-blue-900', ring: 'ring-blue-400', text: 'text-blue-100', border: 'border-blue-500' },
  Beige: { bg: 'bg-[#d8c3a5]', ring: 'ring-amber-400', text: 'text-amber-950', border: 'border-amber-300' }
};

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product: initialProduct,
  isOpen,
  onClose
}) => {
  const { products, updateVariantStock, updateProduct, deleteProduct, addToCart } = useInventory();
  
  // Always bind to the live product from context so stock changes reflect everywhere immediately
  const product = (initialProduct ? products.find(p => p.id === initialProduct.id) : null) || initialProduct;

  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedColor, setSelectedColor] = useState<ShoeColor>('Black');
  const [selectedSize, setSelectedSize] = useState<number>(40);
  const [isZooming, setIsZooming] = useState(false);
  const [zoomPosition, setZoomPosition] = useState({ x: 50, y: 50 });
  const [justAddedToCart, setJustAddedToCart] = useState(false);

  const handleAddToCart = () => {
    if (!product) return;
    const res = addToCart(product, selectedSize, selectedColor, 1);
    if (res.success) {
      setJustAddedToCart(true);
      setTimeout(() => setJustAddedToCart(false), 1500);
    } else if (res.message) {
      alert(res.message);
    }
  };

  // Delete Confirmation State
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Customize / Edit State
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [customActiveColor, setCustomActiveColor] = useState<ShoeColor>('Black');
  const [editName, setEditName] = useState('');
  const [editSku, setEditSku] = useState('');
  const [editGender, setEditGender] = useState<ShoeGender>('men');
  const [editCategory, setEditCategory] = useState<ShoeCategory>('Sneakers');
  const [editRetailPrice, setEditRetailPrice] = useState<number>(0);
  const [editCostPrice, setEditCostPrice] = useState<number>(0);
  const [editVariantsStock, setEditVariantsStock] = useState<Record<string, number>>({});
  const [saveSuccessNotification, setSaveSuccessNotification] = useState(false);

  const imageContainerRef = useRef<HTMLDivElement>(null);

  // When product ID changes (user opens a product), initialize defaults
  useEffect(() => {
    if (initialProduct) {
      const firstVariant = initialProduct.variants[0];
      const initialColor = firstVariant?.color || 'Black';
      setSelectedColor(initialColor);
      setSelectedSize(firstVariant ? firstVariant.size : 40);
      setCustomActiveColor(initialColor);

      if (initialProduct.colorImages && initialProduct.colorImages[initialColor]) {
        const foundIdx = initialProduct.images.findIndex(img => img === initialProduct.colorImages?.[initialColor]);
        setSelectedImageIndex(foundIdx !== -1 ? foundIdx : 0);
      } else {
        setSelectedImageIndex(0);
      }

      setEditName(initialProduct.name);
      setEditSku(initialProduct.sku || '');
      setEditGender(initialProduct.gender);
      setEditCategory(initialProduct.category);
      setEditRetailPrice(initialProduct.retailPrice);
      setEditCostPrice(initialProduct.costPrice);

      const stockMap: Record<string, number> = {};
      initialProduct.variants.forEach(v => {
        stockMap[`${v.color}-${v.size}`] = v.stock;
      });
      setEditVariantsStock(stockMap);
      setShowDeleteConfirm(false);
      setIsCustomizing(false);
    }
  }, [initialProduct?.id]);

  const handleSelectColor = (color: ShoeColor) => {
    setSelectedColor(color);
    if (product && product.colorImages && product.colorImages[color]) {
      const colorImg = product.colorImages[color];
      const foundIdx = product.images.findIndex(img => img === colorImg);
      if (foundIdx !== -1) {
        setSelectedImageIndex(foundIdx);
      }
    }
  };

  const handleCustomSelectColor = (color: ShoeColor) => {
    setCustomActiveColor(color);
    if (product && product.colorImages && product.colorImages[color]) {
      const colorImg = product.colorImages[color];
      const foundIdx = product.images.findIndex(img => img === colorImg);
      if (foundIdx !== -1) {
        setSelectedImageIndex(foundIdx);
      }
    }
  };

  const handleStartCustomizing = () => {
    if (!product) return;
    setCustomActiveColor(selectedColor);
    setEditName(product.name);
    setEditSku(product.sku || '');
    setEditGender(product.gender);
    setEditCategory(product.category);
    setEditRetailPrice(product.retailPrice);
    setEditCostPrice(product.costPrice);

    const stockMap: Record<string, number> = {};
    product.variants.forEach(v => {
      stockMap[`${v.color}-${v.size}`] = v.stock;
    });
    setEditVariantsStock(stockMap);
    setIsCustomizing(true);
  };

  if (!isOpen || !product) return null;

  // Available unique sizes and colors for this product
  const availableSizes = Array.from(new Set(product.variants.map(v => v.size))).sort((a, b) => a - b);
  const availableColors = Array.from(new Set(product.variants.map(v => v.color))) as ShoeColor[];
  const totalAllColorsStock = product.variants.reduce((sum, v) => sum + v.stock, 0);

  // Current selected variant stock in View mode
  const currentVariant = product.variants.find(
    v => v.size === selectedSize && v.color === selectedColor
  );
  const currentStock = currentVariant ? currentVariant.stock : 0;
  const isOutOfStock = currentStock <= 0;

  // Zoom lens mouse move handler
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!imageContainerRef.current) return;
    const { left, top, width, height } = imageContainerRef.current.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setZoomPosition({ x, y });
  };

  const nextImage = () => {
    if (product.images.length > 0) {
      setSelectedImageIndex((selectedImageIndex + 1) % product.images.length);
    }
  };

  const prevImage = () => {
    if (product.images.length > 0) {
      setSelectedImageIndex((selectedImageIndex - 1 + product.images.length) % product.images.length);
    }
  };

  const handleDeleteProduct = () => {
    deleteProduct(product.id);
    setShowDeleteConfirm(false);
    onClose();
  };

  // Stock edit helper methods in Customize mode
  const getColorStockTotal = (color: ShoeColor) => {
    return availableSizes.reduce((sum, size) => {
      const key = `${color}-${size}`;
      const stock = editVariantsStock[key] !== undefined 
        ? editVariantsStock[key] 
        : (product.variants.find(v => v.color === color && v.size === size)?.stock || 0);
      return sum + (Number(stock) || 0);
    }, 0);
  };

  const handleStockChange = (color: ShoeColor, size: number, newStock: number) => {
    const key = `${color}-${size}`;
    setEditVariantsStock(prev => ({
      ...prev,
      [key]: Math.max(0, newStock)
    }));
  };

  const handleBatchAdjustColor = (color: ShoeColor, delta: number) => {
    setEditVariantsStock(prev => {
      const next = { ...prev };
      availableSizes.forEach(size => {
        const key = `${color}-${size}`;
        const current = next[key] !== undefined 
          ? next[key] 
          : (product.variants.find(v => v.color === color && v.size === size)?.stock || 0);
        next[key] = Math.max(0, current + delta);
      });
      return next;
    });
  };

  const handleSetColorStock = (color: ShoeColor, value: number) => {
    setEditVariantsStock(prev => {
      const next = { ...prev };
      availableSizes.forEach(size => {
        const key = `${color}-${size}`;
        next[key] = Math.max(0, value);
      });
      return next;
    });
  };

  const handleSaveCustomization = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) return;

    // Build updated variants stock
    const updatedVariants = product.variants.map(v => {
      const key = `${v.color}-${v.size}`;
      const newStock = editVariantsStock[key] !== undefined ? editVariantsStock[key] : v.stock;
      return {
        ...v,
        stock: Math.max(0, Number(newStock) || 0)
      };
    });

    const calculatedTotalStock = updatedVariants.reduce((sum, v) => sum + v.stock, 0);

    const updatedProduct: ShoeProduct = {
      ...product,
      name: editName.trim(),
      sku: editSku.trim() || product.sku,
      gender: editGender,
      category: editCategory,
      retailPrice: Number(editRetailPrice) || product.retailPrice,
      costPrice: Number(editCostPrice) || product.costPrice,
      variants: updatedVariants,
      totalStock: calculatedTotalStock
    };

    // Commit to context
    updateProduct(updatedProduct);

    // Keep the customized color active in detail view so user sees their new stock instantly!
    setSelectedColor(customActiveColor);
    if (product.colorImages && product.colorImages[customActiveColor]) {
      const foundIdx = product.images.findIndex(img => img === product.colorImages?.[customActiveColor]);
      if (foundIdx !== -1) setSelectedImageIndex(foundIdx);
    }

    setIsCustomizing(false);
    setSaveSuccessNotification(true);
    setTimeout(() => setSaveSuccessNotification(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/85 backdrop-blur-md overflow-y-auto animate-in fade-in">
      <div className="relative w-full max-w-5xl bg-slate-900 border border-slate-700/80 rounded-2xl overflow-hidden shadow-2xl my-auto">
        
        {/* Floating Close Button for Desktop */}
        <button
          type="button"
          onClick={onClose}
          className="hidden lg:flex absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white items-center justify-center transition-colors border border-slate-700/60 shadow-lg"
          title="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Mobile Header Bar with clean title and close button */}
        <div className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-900/95 sticky top-0 z-30">
          <span className="text-xs font-bold text-white truncate pr-2">
            {isCustomizing ? 'Customize Shoe Details' : product.name}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors border border-slate-700/80 shrink-0"
            title="Close"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Modal Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
          
          {/* Left Side: Photo Showcase & Live Zoom Lens */}
          <div className="lg:col-span-5 p-5 sm:p-6 border-b lg:border-b-0 lg:border-r border-slate-800 flex flex-col justify-between space-y-4 bg-slate-900/40">
            <div>
              {/* Main Photo with Lens */}
              <div 
                ref={imageContainerRef}
                onMouseEnter={() => setIsZooming(true)}
                onMouseLeave={() => setIsZooming(false)}
                onMouseMove={handleMouseMove}
                className="relative w-full h-72 sm:h-80 rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center cursor-crosshair group select-none shadow-inner"
              >
                {product.images.length > 0 ? (
                  <>
                    <img
                      src={product.images[selectedImageIndex]}
                      alt={`${product.name} ${isCustomizing ? customActiveColor : selectedColor}`}
                      className="w-full h-full object-cover transition-transform duration-75"
                      referrerPolicy="no-referrer"
                      style={
                        isZooming
                          ? {
                              transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%`,
                              transform: 'scale(2.2)',
                            }
                          : undefined
                      }
                    />

                    {/* Zoom hint badge */}
                    {!isZooming && (
                      <div className="absolute bottom-3 right-3 px-2.5 py-1 bg-black/70 backdrop-blur-md rounded-lg text-[11px] text-slate-300 flex items-center gap-1.5 border border-slate-700/50 pointer-events-none">
                        <ZoomIn className="w-3.5 h-3.5 text-amber-400" />
                        <span>Hover to Zoom</span>
                      </div>
                    )}

                    {/* Navigation arrows */}
                    {product.images.length > 1 && !isZooming && (
                      <>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            prevImage();
                          }}
                          className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-slate-900/80 hover:bg-slate-800 text-white flex items-center justify-center border border-slate-700 transition-colors"
                          title="Previous photo"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            nextImage();
                          }}
                          className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-slate-900/80 hover:bg-slate-800 text-white flex items-center justify-center border border-slate-700 transition-colors"
                          title="Next photo"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center text-slate-600">
                    <Package className="w-16 h-16 mb-2" />
                    <span className="text-xs">No image provided</span>
                  </div>
                )}
              </div>

              {/* Thumbnails Gallery */}
              {product.images.length > 1 && (
                <div className="flex items-center gap-2 mt-3 overflow-x-auto pb-1">
                  {product.images.map((img, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedImageIndex(idx)}
                      className={`relative w-12 h-12 rounded-xl overflow-hidden shrink-0 border-2 transition-all ${
                        selectedImageIndex === idx
                          ? 'border-amber-400 ring-2 ring-amber-400/30'
                          : 'border-slate-800 hover:border-slate-700 opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img 
                        src={img} 
                        alt={`Thumb ${idx + 1}`} 
                        className="w-full h-full object-cover" 
                        referrerPolicy="no-referrer"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Specs Pill Badges */}
            <div className="grid grid-cols-4 gap-2 pt-4 border-t border-slate-800 text-center">
              <div className="bg-slate-950 px-2 py-2.5 rounded-xl border border-slate-800 flex flex-col items-center justify-center text-center">
                <span className="text-[10px] text-slate-400 uppercase font-mono tracking-wider block leading-tight">SKU</span>
                <span className="text-xs font-bold font-mono text-amber-300 truncate max-w-full block mt-0.5" title={product.sku}>{product.sku}</span>
              </div>
              <div className="bg-slate-950 px-2 py-2.5 rounded-xl border border-slate-800 flex flex-col items-center justify-center text-center">
                <span className="text-[10px] text-slate-400 uppercase font-mono tracking-wider block leading-tight">Gender</span>
                <span className="text-xs font-bold text-slate-100 capitalize mt-0.5">{product.gender === 'men' ? "Men's" : "Women's"}</span>
              </div>
              <div className="bg-slate-950 px-2 py-2.5 rounded-xl border border-slate-800 flex flex-col items-center justify-center text-center">
                <span className="text-[10px] text-slate-400 uppercase font-mono tracking-wider block leading-tight">Category</span>
                <span className="text-xs font-bold text-slate-100 truncate block mt-0.5">{product.category}</span>
              </div>
              <div className="bg-slate-950 px-2 py-2.5 rounded-xl border border-slate-800 flex flex-col items-center justify-center text-center">
                <span className="text-[10px] text-slate-400 uppercase font-mono tracking-wider block leading-tight">Available</span>
                <span className="text-xs font-bold text-amber-400 mt-0.5">{totalAllColorsStock} Pairs</span>
              </div>
            </div>
          </div>

          {/* Right Side: View Mode OR In-Place Customize Mode */}
          <div className="lg:col-span-7 p-5 sm:p-6 flex flex-col justify-between space-y-4">
            {!isCustomizing ? (
              /* VIEW MODE */
              <div className="space-y-4 flex-1 flex flex-col justify-between">
                <div className="space-y-4">
                  {/* Title & Price Header */}
                  <div className="flex items-start justify-between gap-3 pr-10">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-amber-500/10 text-amber-300 border border-amber-500/25 font-mono text-xs font-bold tracking-wide shadow-sm">
                          <span className="text-[10px] uppercase font-sans font-semibold text-slate-400">SKU:</span>
                          <span>{product.sku}</span>
                        </span>
                        {currentVariant && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-950 text-slate-300 border border-slate-800 font-mono text-xs">
                            <span className="text-[10px] text-slate-400">Variant:</span>
                            <span className="text-amber-200/90 font-medium">{currentVariant.sku}</span>
                          </span>
                        )}
                      </div>
                      <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight leading-snug">
                        {product.name}
                      </h1>
                      <div className="mt-1 flex flex-col">
                        <span className="text-xl font-mono font-bold text-amber-400">
                          ${product.retailPrice.toFixed(2)}
                        </span>
                        <span className="text-xs font-mono text-slate-400 mt-0.5">
                          Cost: ${product.costPrice.toFixed(2)} (${(product.retailPrice - product.costPrice).toFixed(2)} margin)
                        </span>
                      </div>
                    </div>
                    {saveSuccessNotification && (
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-700/80 px-3 py-1 rounded-lg animate-in fade-in shrink-0 shadow-lg">
                        <Check className="w-3.5 h-3.5" />
                        <span>Stock Updated!</span>
                      </span>
                    )}
                  </div>

                  {/* Color Selector */}
                  <div>
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-300 mb-2">
                      <span>Color Options</span>
                      <span className="text-amber-400 font-medium capitalize">{selectedColor}</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {availableColors.map(color => {
                        const isSelected = selectedColor === color;
                        const colorStock = product.variants
                          .filter(v => v.color === color)
                          .reduce((sum, v) => sum + v.stock, 0);

                        return (
                          <button
                            key={color}
                            type="button"
                            onClick={() => handleSelectColor(color)}
                            className={`py-2 px-2.5 rounded-xl border transition-all flex items-center justify-between gap-2 ${
                              isSelected
                                ? 'bg-amber-500/10 border-amber-400 text-white shadow-sm ring-1 ring-amber-400/30'
                                : 'bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-300'
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${COLOR_STYLES[color]?.bg} ${COLOR_STYLES[color]?.ring} border border-slate-700`} />
                              <span className="text-xs font-medium truncate">{color}</span>
                            </div>
                            <span className="text-[11px] font-mono text-slate-400 shrink-0">{colorStock}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Size Selector */}
                  <div>
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-300 mb-2">
                      <span>Select Size ({product.gender === 'men' ? 'Men 40–44' : 'Women 36–40'})</span>
                      <span className={`font-mono text-xs font-medium ${isOutOfStock ? 'text-rose-400' : 'text-emerald-400'}`}>
                        {isOutOfStock ? 'Out of Stock' : `${currentStock} in stock`}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-5 gap-2">
                      {availableSizes.map(size => {
                        const variant = product.variants.find(
                          v => v.size === size && v.color === selectedColor
                        );
                        const stock = variant ? variant.stock : 0;
                        const isSelected = selectedSize === size;
                        const isNone = stock === 0;

                        return (
                          <button
                            key={size}
                            type="button"
                            disabled={isNone}
                            onClick={() => setSelectedSize(size)}
                            className={`py-2 px-1 rounded-xl border text-center transition-all flex flex-col items-center justify-center ${
                              isSelected
                                ? 'border-amber-400 bg-amber-500/15 text-amber-300 ring-1 ring-amber-400/40 shadow-sm'
                                : isNone
                                ? 'border-slate-800/60 bg-slate-950/40 text-slate-500 opacity-50 cursor-not-allowed'
                                : 'border-slate-800 bg-slate-950 hover:border-slate-700 text-slate-200'
                            }`}
                          >
                            <span className="text-sm font-bold font-mono">{size}</span>
                            <span className={`text-[10px] font-mono mt-0.5 ${isNone ? 'text-rose-400/80' : isSelected ? 'text-amber-400 font-medium' : 'text-slate-400'}`}>
                              {isNone ? 'Out' : `${stock} left`}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Bottom Actions Bar for View Mode: Delete, Customize and Add to Cart */}
                <div className="pt-4 mt-auto border-t border-slate-800 flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="py-2.5 px-3 rounded-xl border border-rose-900/50 bg-rose-950/30 hover:bg-rose-900/40 text-rose-400 hover:text-rose-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                    title="Delete product"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span className="hidden sm:inline">Delete</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleStartCustomizing}
                    className="py-2.5 px-3.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm"
                  >
                    <Sliders className="w-4 h-4 text-amber-400" />
                    <span>Customize</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleAddToCart}
                    disabled={isOutOfStock}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:bg-slate-800 disabled:text-slate-600 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shadow-amber-500/10 active:scale-95"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    <span>{justAddedToCart ? 'Added to Cart!' : 'Add to Cart'}</span>
                  </button>
                </div>
              </div>
            ) : (
              /* CUSTOMIZE IN-PLACE MODE */
              <form onSubmit={handleSaveCustomization} className="space-y-3.5 flex-1 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center pb-2 border-b border-slate-800 pr-8">
                    <div className="flex items-center gap-2 text-xs font-semibold text-white">
                      <Sliders className="w-4 h-4 text-amber-400" />
                      <span>Customize Shoe Details & Stock</span>
                    </div>
                  </div>

                  {/* Shoe Model Name & Model SKU */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Shoe Model Name
                      </label>
                      <input
                        type="text"
                        required
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400 transition-colors font-medium"
                        placeholder="e.g. AeroGlide Urban Sneaker"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Model SKU
                      </label>
                      <input
                        type="text"
                        required
                        value={editSku}
                        onChange={(e) => setEditSku(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-amber-400 font-mono font-bold focus:outline-none focus:border-amber-400 transition-colors uppercase"
                        placeholder="e.g. AG-MS-01"
                      />
                    </div>
                  </div>

                  {/* Gender & Category */}
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Gender
                      </label>
                      <select
                        value={editGender}
                        onChange={(e) => setEditGender(e.target.value as ShoeGender)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400 transition-colors"
                      >
                        <option value="men">Men's Footwear</option>
                        <option value="women">Women's Footwear</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Category
                      </label>
                      <select
                        value={editCategory}
                        onChange={(e) => setEditCategory(e.target.value as ShoeCategory)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400 transition-colors"
                      >
                        {CATEGORIES.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Retail & Cost Price */}
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Retail Price ($)
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-mono text-xs">$</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          required
                          value={editRetailPrice}
                          onChange={(e) => setEditRetailPrice(parseFloat(e.target.value) || 0)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-6 pr-3 py-2 text-xs text-amber-400 font-mono font-bold focus:outline-none focus:border-amber-400 transition-colors"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Cost Price ($)
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-mono text-xs">$</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          required
                          value={editCostPrice}
                          onChange={(e) => setEditCostPrice(parseFloat(e.target.value) || 0)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-6 pr-3 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-amber-400 transition-colors"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Color & Size Variant Management */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-300">
                        Variant Sizes & Stock by Color
                      </span>
                      <span className="text-[11px] font-mono text-amber-400 font-semibold">
                        Total: {Object.values(editVariantsStock).reduce((a, b) => a + (Number(b) || 0), 0)} pairs
                      </span>
                    </div>

                    {/* Color Chips */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {availableColors.map(color => {
                        const isSelected = customActiveColor === color;
                        const colorTotal = getColorStockTotal(color);

                        return (
                          <button
                            key={color}
                            type="button"
                            onClick={() => handleCustomSelectColor(color)}
                            className={`py-2 px-2.5 rounded-xl border transition-all flex items-center justify-between gap-1.5 ${
                              isSelected
                                ? 'bg-amber-500/10 border-amber-400 text-white shadow-sm ring-1 ring-amber-400/30'
                                : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                            }`}
                          >
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${COLOR_STYLES[color]?.bg} ${COLOR_STYLES[color]?.ring} border border-slate-700`} />
                              <span className="text-xs font-medium truncate">{color}</span>
                            </div>
                            <span className="text-[11px] font-mono text-slate-400 shrink-0">{colorTotal}</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Active Colorway Size Steppers */}
                    {customActiveColor && (
                      <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 space-y-2.5">
                        {/* Color header and quick actions */}
                        <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-800">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${COLOR_STYLES[customActiveColor]?.bg} border border-slate-600`} />
                            <span className="text-xs font-semibold text-white capitalize truncate">{customActiveColor} Sizes</span>
                          </div>

                          {/* Quick batch stock adjustments */}
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleBatchAdjustColor(customActiveColor, 1)}
                              className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-mono font-medium rounded-md border border-slate-700 transition-colors"
                              title="Add +1 to all sizes in this color"
                            >
                              +1 All
                            </button>
                            <button
                              type="button"
                              onClick={() => handleBatchAdjustColor(customActiveColor, 5)}
                              className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-mono font-medium rounded-md border border-slate-700 transition-colors"
                              title="Add +5 to all sizes in this color"
                            >
                              +5 All
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSetColorStock(customActiveColor, 0)}
                              className="px-2 py-0.5 bg-rose-950/40 hover:bg-rose-950/70 text-rose-300 text-[10px] font-mono font-medium rounded-md border border-rose-900/50 transition-colors"
                              title="Set all sizes in this color to 0"
                            >
                              Clear
                            </button>
                          </div>
                        </div>

                        {/* Grid of Shoe Sizes with Clean Integrated Steppers */}
                        <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
                          {availableSizes.map(size => {
                            const key = `${customActiveColor}-${size}`;
                            const currentStockVal = editVariantsStock[key] !== undefined 
                              ? editVariantsStock[key] 
                              : (product.variants.find(v => v.color === customActiveColor && v.size === size)?.stock || 0);
                            const isOut = currentStockVal === 0;

                            return (
                              <div
                                key={size}
                                className={`py-2 px-1 rounded-xl border flex flex-col items-center justify-between gap-1.5 transition-all min-w-0 ${
                                  isOut 
                                    ? 'bg-rose-950/10 border-rose-900/30' 
                                    : 'bg-slate-900 border-slate-800'
                                }`}
                              >
                                <span className={`text-[11px] sm:text-xs font-bold font-mono whitespace-nowrap leading-none ${isOut ? 'text-rose-300' : 'text-slate-200'}`}>
                                  Size {size}
                                </span>

                                <div className="w-full px-1">
                                  <input
                                    type="number"
                                    min="0"
                                    value={currentStockVal}
                                    onChange={(e) => {
                                      const val = parseInt(e.target.value, 10);
                                      handleStockChange(customActiveColor, size, isNaN(val) ? 0 : Math.max(0, val));
                                    }}
                                    className={`w-full bg-slate-950 border rounded-lg py-1 px-1 text-center font-mono font-bold text-xs focus:outline-none focus:border-amber-400 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                                      isOut ? 'border-rose-900/60 text-rose-400' : 'border-slate-800 text-amber-300'
                                    }`}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Form Save / Cancel Actions */}
                <div className="flex items-center gap-2 pt-3 mt-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsCustomizing(false)}
                    className="py-2.5 px-4 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-md shadow-amber-500/10 active:scale-95"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save Changes</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1.5">
              <h3 className="text-base font-bold text-white">Delete Shoe Model?</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Are you sure you want to delete <span className="text-slate-200 font-semibold">{product.name}</span> from the warehouse inventory? All associated variant stock will be permanently removed.
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteProduct}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-colors shadow-lg shadow-rose-600/20"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
