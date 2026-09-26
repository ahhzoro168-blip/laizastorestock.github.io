import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Upload, 
  Plus, 
  Trash2, 
  Check, 
  Palette,
  ImageIcon,
  Cloud,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { ShoeGender, ShoeColor, ShoeVariant } from '../types';
import { useInventory } from '../context/InventoryContext';
import { useGoogleAuth } from '../context/GoogleAuthContext';
import { compressImageDataUrl } from '../utils/imageCompressor';

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ColorwayDraft {
  id: string;
  colorName: string;
  colorHex?: string;
  image: string;
  sizes: { size: number; stock: number }[];
}

const INITIAL_SIZES = [
  { size: 40, stock: 0 },
  { size: 41, stock: 0 },
  { size: 42, stock: 0 },
  { size: 43, stock: 0 },
  { size: 44, stock: 0 },
];

const COLOR_PRESETS: { name: string; hex: string; border?: string }[] = [
  { name: 'ខ្មៅ', hex: '#0f172a', border: '#334155' },
  { name: 'ស', hex: '#ffffff', border: '#cbd5e1' },
  { name: 'ខៀវ', hex: '#1e40af' },
  { name: 'ក្រហម', hex: '#dc2626' },
  { name: 'ប្រផេះ', hex: '#64748b' },
  { name: 'ត្នោត', hex: '#78350f' },
  { name: 'បៃតង', hex: '#16a34a' },
  { name: 'បន៍', hex: '#fef08a', border: '#e2e8f0' },
  { name: 'លឿង', hex: '#eab308' },
  { name: 'ទឹកក្រូច', hex: '#ea580c' },
  { name: 'ផ្កាឈូក', hex: '#ec4899' },
  { name: 'ស្វាយ', hex: '#9333ea' },
];

function getColorHex(colorName: string): string {
  const match = COLOR_PRESETS.find(p => p.name === colorName);
  if (match) return match.hex;
  return '#475569';
}

const INITIAL_COLORWAYS: ColorwayDraft[] = [
  { id: 'cw-1', colorName: 'ខ្មៅ', colorHex: '#0f172a', image: '', sizes: [...INITIAL_SIZES.map(s => ({ ...s }))] },
  { id: 'cw-2', colorName: 'ស', colorHex: '#ffffff', image: '', sizes: [...INITIAL_SIZES.map(s => ({ ...s }))] },
];

export const AddProductModal: React.FC<AddProductModalProps> = ({
  isOpen,
  onClose
}) => {
  const { 
    addProduct, 
    categories: registeredCategories, 
    modelSkus: registeredSkus
  } = useInventory();
  const { user, uploadProductPhoto } = useGoogleAuth();
  const [isSavingWithDrive, setIsSavingWithDrive] = useState(false);

  // Basic Information
  const [name, setName] = useState('');
  const [gender, setGender] = useState<ShoeGender>('men');
  
  // Model SKUs & Category State
  const skuList = registeredSkus;
  const [sku, setSku] = useState<string>(registeredSkus[0] || '');

  const categories = registeredCategories;
  const [category, setCategory] = useState<string>(registeredCategories[0] || '');

  // Prices initialized as empty string so NO pre-filled '0' appears!
  const [costPrice, setCostPrice] = useState<string>('');
  const [retailPrice, setRetailPrice] = useState<string>('');

  // Colorways & Sizes State
  const [colorways, setColorways] = useState<ColorwayDraft[]>(INITIAL_COLORWAYS);
  const [customColorInput, setCustomColorInput] = useState('');
  const [selectedColorHex, setSelectedColorHex] = useState<string>('#1e40af');
  const [showColorPalette, setShowColorPalette] = useState<boolean>(false);

  const colorwayFileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  const resetForm = () => {
    setName('');
    setGender('men');
    setSku(registeredSkus[0] || '');
    setCategory(registeredCategories[0] || '');
    setCostPrice('');
    setRetailPrice('');
    setColorways([
      { id: 'cw-1', colorName: 'ខ្មៅ', colorHex: '#0f172a', image: '', sizes: INITIAL_SIZES.map(s => ({ ...s, stock: 0 })) },
      { id: 'cw-2', colorName: 'ស', colorHex: '#ffffff', image: '', sizes: INITIAL_SIZES.map(s => ({ ...s, stock: 0 })) }
    ]);
    setCustomColorInput('');
    setSelectedColorHex('#1e40af');
    setShowColorPalette(false);
    setIsSavingWithDrive(false);
  };

  useEffect(() => {
    if (isOpen) {
      resetForm();
    }
  }, [isOpen]);

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  // Handle local image file upload for a specific Colorway with compression
  const handleColorwayFileUpload = (colorwayId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      if (event.target?.result) {
        const photoUrl = event.target.result as string;
        const compressed = await compressImageDataUrl(photoUrl);
        setColorways(prev => prev.map(cw => cw.id === colorwayId ? { ...cw, image: compressed } : cw));
      }
    };
    reader.readAsDataURL(file);
  };

  // Gender Change & Automatic Size Reconfiguration
  const handleGenderChange = (newGender: 'men' | 'women') => {
    setGender(newGender);
    const targetSizeNumbers = newGender === 'women'
      ? [36, 37, 38, 39, 40]
      : [40, 41, 42, 43, 44];

    setColorways(prev => prev.map(cw => ({
      ...cw,
      sizes: targetSizeNumbers.map(sz => {
        const existing = cw.sizes.find(s => s.size === sz);
        return { size: sz, stock: existing ? existing.stock : 0 };
      })
    })));
  };

  // Toggle or add colorway
  const handleToggleColorPreset = (preset: { name: string; hex: string }) => {
    const exists = colorways.some(cw => cw.colorName.trim().toLowerCase() === preset.name.toLowerCase());
    if (exists) {
      if (colorways.length <= 1) {
        alert('Product must have at least one colorway.');
        return;
      }
      setColorways(prev => prev.filter(cw => cw.colorName.trim().toLowerCase() !== preset.name.toLowerCase()));
    } else {
      const currentSizes = gender === 'women'
        ? [36, 37, 38, 39, 40]
        : [40, 41, 42, 43, 44];

      const newCw: ColorwayDraft = {
        id: `cw-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        colorName: preset.name,
        colorHex: preset.hex,
        image: '',
        sizes: currentSizes.map(sz => ({ size: sz, stock: 0 }))
      };
      setColorways(prev => [...prev, newCw]);
    }
  };

  // Colorways Management for custom color
  const handleAddCustomColor = () => {
    const nameToUse = customColorInput.trim();
    if (!nameToUse) return;
    const exists = colorways.some(cw => cw.colorName.trim().toLowerCase() === nameToUse.toLowerCase());
    if (exists) {
      alert(`The color "${nameToUse}" is already added.`);
      setCustomColorInput('');
      return;
    }

    const hexToUse = selectedColorHex || getColorHex(nameToUse);
    const currentSizes = gender === 'women'
      ? [36, 37, 38, 39, 40]
      : [40, 41, 42, 43, 44];

    const newCw: ColorwayDraft = {
      id: `cw-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      colorName: nameToUse,
      colorHex: hexToUse,
      image: '',
      sizes: currentSizes.map(sz => ({ size: sz, stock: 0 }))
    };
    setColorways(prev => [...prev, newCw]);
    setCustomColorInput('');
  };

  const handleRemoveColorway = (id: string) => {
    if (colorways.length <= 1) {
      alert('A product must have at least one colorway.');
      return;
    }
    setColorways(prev => prev.filter(cw => cw.id !== id));
  };

  const handleSizeStockChange = (colorwayId: string, sizeNum: number, stockVal: number) => {
    setColorways(prev => prev.map(cw => {
      if (cw.id !== colorwayId) return cw;
      return {
        ...cw,
        sizes: cw.sizes.map(s => s.size === sizeNum ? { ...s, stock: Math.max(0, stockVal) } : s)
      };
    }));
  };

  const handleFillAllStock = (colorwayId: string, stockVal: number) => {
    setColorways(prev => prev.map(cw => {
      if (cw.id !== colorwayId) return cw;
      return {
        ...cw,
        sizes: cw.sizes.map(s => ({ ...s, stock: stockVal }))
      };
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      alert('Please provide a shoe product name.');
      return;
    }

    const finalSku = sku.trim() || `ST-${Math.floor(1000 + Math.random() * 9000)}`;

    setIsSavingWithDrive(true);

    // Compress base64 images to small JPEGs (~15KB) so products with 10-20 colorways stay well under Firestore's 1MB limit
    const updatedColorways = [...colorways];
    for (let i = 0; i < updatedColorways.length; i++) {
      const cw = updatedColorways[i];
      if (cw.image && cw.image.startsWith('data:image')) {
        try {
          const compressed = await compressImageDataUrl(cw.image, 500, 0.65);
          updatedColorways[i] = { ...cw, image: compressed };
        } catch (e) {
          console.error(e);
        }
      }
    }

    // If user is connected to Google, upload colorway images to Google Drive
    if (user) {
      for (let i = 0; i < updatedColorways.length; i++) {
        const cw = updatedColorways[i];
        if (cw.image && cw.image.startsWith('data:')) {
          try {
            const driveUrl = await uploadProductPhoto(cw.image, `${finalSku}-${cw.colorName}.jpg`);
            updatedColorways[i] = { ...cw, image: driveUrl };
          } catch (err) {
            console.warn('Could not upload photo to Drive, using local photo:', err);
          }
        }
      }
    }

    // Build colorImages & colorHexes mapping and pick primary image
    const colorImagesMap: Partial<Record<ShoeColor, string>> = {};
    const colorHexesMap: Partial<Record<ShoeColor, string>> = {};
    let firstAvailableColorImage = '';
    updatedColorways.forEach(cw => {
      const cleanColorName = cw.colorName.trim();
      if (cleanColorName) {
        colorHexesMap[cleanColorName as ShoeColor] = cw.colorHex || getColorHex(cleanColorName);
      }
      if (cw.image) {
        colorImagesMap[cleanColorName as ShoeColor] = cw.image;
        if (!firstAvailableColorImage) {
          firstAvailableColorImage = cw.image;
        }
      }
    });

    const defaultShoeImg = firstAvailableColorImage 
      ? [firstAvailableColorImage] 
      : ['https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80'];

    // Generate full variants matrix from defined colorways and sizes
    const generatedVariants: ShoeVariant[] = updatedColorways.flatMap((cw, idx) => {
      const cleanColorName = cw.colorName.trim() || `Color-${idx + 1}`;
      const colorCode = cleanColorName.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().substring(0, 4) || `C${idx + 1}`;
      return cw.sizes.map(s => ({
        sku: `${finalSku}-${colorCode}-${s.size}`,
        size: s.size,
        color: cleanColorName as ShoeColor,
        stock: Number(s.stock) || 0,
        minThreshold: 4,
        salesCount: 0
      }));
    });

    const parsedCostPrice = costPrice !== '' ? parseFloat(costPrice) || 0 : 0;
    const parsedRetailPrice = retailPrice !== '' ? parseFloat(retailPrice) || 0 : 0;

    addProduct({
      name: name.trim(),
      sku: finalSku,
      gender,
      category,
      costPrice: parsedCostPrice,
      retailPrice: parsedRetailPrice,
      images: defaultShoeImg,
      colorImages: colorImagesMap,
      colorHexes: colorHexesMap,
      variants: generatedVariants,
      description: `${name.trim()} footwear product.`,
      specifications: {
        upperMaterial: 'Synthetic Leather / Breathable Mesh',
        soleMaterial: 'Rubber Grip Sole',
        cushioning: 'Soft Foam Insoles',
        weightGrams: 350,
        origin: 'Imported',
        careInstructions: 'Wipe clean with a damp cloth'
      },
      tags: [category, gender]
    });

    resetForm();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/80 backdrop-blur-md p-0 sm:p-4 transition-all">
      <div className="w-full max-w-2xl max-h-[85vh] sm:max-h-[88vh] flex flex-col bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 sm:slide-in-from-bottom-0 duration-200">
        
        {/* Mobile Drag Indicator */}
        <div className="w-12 h-1 bg-slate-700/80 rounded-full mx-auto my-2 sm:hidden shrink-0" />

        {/* Modal Header */}
        <div className="px-4 py-3 sm:px-6 sm:py-4 border-b border-slate-800 flex items-center justify-between shrink-0 bg-slate-900">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white font-['Syne']">
              Add New Shoe Product
            </h2>
            <p className="text-[11px] text-slate-400">
              Publish footwear model, manage colorways & sizes
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 text-xs">
          
          {/* Product Name */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Product Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Apex Velocity Pro Sneaker"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition-colors"
            />
          </div>

          {/* Gender Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              Gender & Size Range
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleGenderChange('men')}
                className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-1.5 cursor-pointer ${
                  gender === 'men'
                    ? 'bg-amber-500/20 border-amber-400 text-amber-300 ring-1 ring-amber-400/40 shadow-sm'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <span>Men (Sizes 40–44)</span>
              </button>
              <button
                type="button"
                onClick={() => handleGenderChange('women')}
                className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-1.5 cursor-pointer ${
                  gender === 'women'
                    ? 'bg-amber-500/20 border-amber-400 text-amber-300 ring-1 ring-amber-400/40 shadow-sm'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <span>Women (Sizes 36–40)</span>
              </button>
            </div>
          </div>

          {/* Model SKU & Category Row */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Model SKU
              </label>
              <div className="relative">
                <select
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-3 pr-8 py-2.5 text-xs font-semibold text-white focus:outline-none focus:border-amber-400 appearance-none cursor-pointer"
                >
                  <option value="">-- Select SKU --</option>
                  {skuList.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Shoe Category
              </label>
              <div className="relative">
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-3 pr-8 py-2.5 text-xs font-semibold text-white focus:outline-none focus:border-amber-400 appearance-none cursor-pointer"
                >
                  {categories.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Pricing Row (Cost & Retail Price without pre-filled '0') */}
          <div className="grid grid-cols-2 gap-2.5 p-3 bg-slate-950/80 rounded-2xl border border-slate-800">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Cost Price (៛)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="1000"
                  min="0"
                  placeholder="0"
                  value={costPrice}
                  onChange={(e) => setCostPrice(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-white placeholder-slate-600 focus:outline-none focus:border-amber-400"
                />
                <span className="absolute right-2.5 top-2 text-slate-500 text-xs font-bold">៛</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Retail Price (៛)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="1000"
                  min="0"
                  placeholder="0"
                  value={retailPrice}
                  onChange={(e) => setRetailPrice(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-white placeholder-slate-600 focus:outline-none focus:border-amber-400"
                />
                <span className="absolute right-2.5 top-2 text-amber-500 text-xs font-bold">៛</span>
              </div>
            </div>
          </div>

          {/* Shoe Colors Section */}
          <div className="pt-2 border-t border-slate-800 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30 shrink-0">
                  <Palette className="w-3.5 h-3.5" />
                </div>
                <h3 className="text-xs font-bold text-white">
                  Shoe Colors ({colorways.length} active)
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setShowColorPalette(prev => !prev)}
                className="flex items-center gap-1 px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-amber-400 rounded-xl text-[11px] font-bold transition-all cursor-pointer shadow-sm active:scale-95"
              >
                <span>{showColorPalette ? 'Hide Palette' : 'Show Palette'}</span>
                {showColorPalette ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </button>
            </div>

            {/* Collapsible Color Swatches Bar */}
            {showColorPalette && (
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-2xl space-y-2.5 animate-in fade-in slide-in-from-top-1 duration-200">
                <div className="text-[11px] font-bold text-slate-300 flex items-center justify-between">
                  <span>Toggle Quick Colors:</span>
                  <span className="text-amber-400 font-normal text-[10px]">{colorways.map(c => c.colorName).join(', ')}</span>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  {COLOR_PRESETS.map((preset) => {
                    const isActive = colorways.some(cw => cw.colorName.trim().toLowerCase() === preset.name.toLowerCase());
                    return (
                      <button
                        key={preset.name}
                        type="button"
                        onClick={() => handleToggleColorPreset(preset)}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                          isActive 
                            ? 'bg-amber-500/20 border-amber-400 text-amber-300 ring-2 ring-amber-400/40' 
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        <span 
                          className="w-3 h-3 rounded-full border shadow-sm shrink-0"
                          style={{ backgroundColor: preset.hex, borderColor: preset.border }}
                        />
                        <span>{preset.name}</span>
                        {isActive && <Check className="w-3 h-3 text-amber-400 stroke-[3]" />}
                      </button>
                    );
                  })}
                </div>

                {/* Custom Color Input */}
                <div className="flex items-center gap-2 pt-1 border-t border-slate-900">
                  <div className="relative flex-1 flex items-center">
                    <span 
                      className="absolute left-3 w-3 h-3 rounded-full border shadow-sm"
                      style={{ backgroundColor: selectedColorHex, borderColor: 'rgba(255,255,255,0.4)' }}
                    />
                    <input
                      type="text"
                      placeholder="Custom color (e.g. Camo, Rose Gold...)"
                      value={customColorInput}
                      onChange={(e) => setCustomColorInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddCustomColor();
                        }
                      }}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-8 pr-2 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 font-semibold"
                    />
                  </div>

                  <label 
                    className="relative flex items-center gap-1 px-2 py-1.5 rounded-xl border border-slate-800 bg-slate-900 text-xs text-slate-300 font-bold cursor-pointer"
                    title="Pick color swatch"
                  >
                    <span 
                      className="w-3 h-3 rounded-full border border-white/40 shadow-sm"
                      style={{ backgroundColor: selectedColorHex }}
                    />
                    <span className="text-[10px]">Picker</span>
                    <input 
                      type="color"
                      value={selectedColorHex}
                      onChange={(e) => setSelectedColorHex(e.target.value)}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                  </label>

                  <button
                    type="button"
                    onClick={handleAddCustomColor}
                    className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl transition-colors cursor-pointer shrink-0"
                  >
                    + Add
                  </button>
                </div>
              </div>
            )}

            {/* Colorways Cards List */}
            <div className="grid grid-cols-1 gap-3">
              {colorways.map((cw) => {
                const totalColorStock = cw.sizes.reduce((sum, s) => sum + (Number(s.stock) || 0), 0);
                const effectiveColorHex = cw.colorHex || getColorHex(cw.colorName);
                
                return (
                  <div 
                    key={cw.id} 
                    className="bg-slate-950 border border-slate-800 rounded-2xl p-3 space-y-3 shadow-md"
                  >
                    {/* Header: Color Swatch, Name, Total Pairs & Quick Stock Buttons */}
                    <div className="flex items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
                      <div className="flex items-center gap-2">
                        <span 
                          className="w-3.5 h-3.5 rounded-full border shrink-0 shadow-sm"
                          style={{ 
                            backgroundColor: effectiveColorHex,
                            borderColor: 'rgba(255,255,255,0.35)'
                          }}
                        />
                        <span className="font-bold text-white text-xs">
                          {cw.colorName}
                        </span>
                        <span className="text-[10px] bg-amber-500/10 text-amber-400 font-bold px-2 py-0.5 rounded-full border border-amber-500/20">
                          {totalColorStock} pairs
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {/* Quick Fill Stock Buttons */}
                        <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-0.5 rounded-lg text-[10px]">
                          <button
                            type="button"
                            onClick={() => handleFillAllStock(cw.id, 5)}
                            className="px-1.5 py-0.5 text-slate-400 hover:text-amber-300 font-semibold"
                            title="Set 5 pairs per size"
                          >
                            5
                          </button>
                          <button
                            type="button"
                            onClick={() => handleFillAllStock(cw.id, 10)}
                            className="px-1.5 py-0.5 text-slate-400 hover:text-amber-300 font-semibold"
                            title="Set 10 pairs per size"
                          >
                            10
                          </button>
                          <button
                            type="button"
                            onClick={() => handleFillAllStock(cw.id, 20)}
                            className="px-1.5 py-0.5 text-slate-400 hover:text-amber-300 font-semibold"
                            title="Set 20 pairs per size"
                          >
                            20
                          </button>
                          <button
                            type="button"
                            onClick={() => handleFillAllStock(cw.id, 0)}
                            className="px-1.5 py-0.5 text-rose-400 hover:bg-rose-500/10 font-semibold"
                            title="Reset stock to 0"
                          >
                            0
                          </button>
                        </div>

                        {/* Delete Colorway */}
                        <button
                          type="button"
                          onClick={() => handleRemoveColorway(cw.id)}
                          className="p-1 text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                          title="Remove colorway"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Photo Upload Row (No text headers, no camera button) */}
                    <div className="flex items-center gap-3">
                      <div 
                        onClick={() => colorwayFileInputRefs.current[cw.id]?.click()}
                        className="relative w-14 h-14 rounded-xl bg-slate-900 border border-slate-800 overflow-hidden flex items-center justify-center shrink-0 cursor-pointer hover:border-amber-400/50 transition-colors group"
                        title="Click to upload photo"
                      >
                        {cw.image ? (
                          <>
                            <img src={cw.image} alt={cw.colorName} className="w-full h-full object-cover" />
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setColorways(prev => prev.map(c => c.id === cw.id ? { ...c, image: '' } : c));
                              }}
                              className="absolute top-1 right-1 p-0.5 bg-rose-600/90 text-white rounded-full hover:bg-rose-700"
                              title="Remove photo"
                            >
                              <Trash2 className="w-2.5 h-2.5" />
                            </button>
                          </>
                        ) : (
                          <div className="text-center p-1 text-slate-600 group-hover:text-amber-400 transition-colors">
                            <ImageIcon className="w-5 h-5 mx-auto text-slate-600 group-hover:text-amber-400" />
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => colorwayFileInputRefs.current[cw.id]?.click()}
                          className="px-3 py-1.5 rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Upload className="w-3.5 h-3.5 text-amber-400" />
                          <span>Upload Photo</span>
                        </button>

                        <input
                          ref={(el) => { colorwayFileInputRefs.current[cw.id] = el; }}
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleColorwayFileUpload(cw.id, e)}
                          className="hidden"
                        />
                      </div>
                    </div>

                    {/* Sizes & Stock Inputs */}
                    <div className="space-y-1">
                      <div className="text-[10px] font-semibold text-slate-400">
                        Size Quantities:
                      </div>

                      <div className="grid grid-cols-5 gap-1.5">
                        {cw.sizes.map((s) => (
                          <div 
                            key={s.size} 
                            className="bg-slate-900 border border-slate-800 rounded-lg p-1 text-center focus-within:border-amber-400"
                          >
                            <div className="text-[10px] font-bold text-slate-300">
                              Size {s.size}
                            </div>
                            <input
                              type="number"
                              min="0"
                              placeholder="0"
                              value={s.stock === 0 ? '' : s.stock}
                              onChange={(e) => handleSizeStockChange(cw.id, s.size, parseInt(e.target.value) || 0)}
                              className="w-full bg-slate-950 border border-slate-800 rounded px-1 py-0.5 text-center text-xs font-bold text-amber-400 placeholder-slate-600 focus:outline-none focus:border-amber-400 mt-0.5"
                              title={`Quantity in stock for size ${s.size}`}
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          </div>

          {/* Bottom Action Footer */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800 shrink-0">
            <button
              type="button"
              onClick={handleClose}
              className="py-2.5 px-4 rounded-xl border border-slate-800 bg-slate-900 text-slate-300 text-xs font-semibold hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSavingWithDrive}
              className="py-2.5 px-5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition-all shadow-lg shadow-amber-500/20 active:scale-95 cursor-pointer"
            >
              {isSavingWithDrive ? (
                <>
                  <Cloud className="w-4 h-4 animate-bounce" />
                  <span>Uploading Drive Photos...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>Add Product</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
