import React, { useState, useRef } from 'react';
import { 
  X, 
  Upload, 
  Camera, 
  Plus, 
  Trash2, 
  Check, 
  ZoomIn, 
  Palette,
  Sparkles,
  ImageIcon,
  Cloud,
  CheckCircle2
} from 'lucide-react';
import { ShoeGender, ShoeCategory, ShoeColor, ShoeVariant } from '../types';
import { useInventory } from '../context/InventoryContext';
import { useGoogleAuth } from '../context/GoogleAuthContext';
import { CameraCaptureModal } from './CameraCaptureModal';

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DEFAULT_CATEGORIES: string[] = [
  'Sneakers',
  'Formal & Loafers',
  'Running & Athletic',
  'Boots & Outdoor',
  'Casual & Lifestyle'
];

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

export const COLOR_PRESETS = [
  { name: 'ខ្មៅ', hex: '#0f172a', border: '#475569' },
  { name: 'ស', hex: '#ffffff', border: '#cbd5e1' },
  { name: 'ខៀវ', hex: '#1e40af', border: '#3b82f6' },
  { name: 'ក្រហម', hex: '#dc2626', border: '#ef4444' },
  { name: 'ប្រផេះ', hex: '#64748b', border: '#94a3b8' },
  { name: 'ត្នោត', hex: '#78350f', border: '#b45309' },
  { name: 'បៃតង', hex: '#16a34a', border: '#22c55e' },
  { name: 'បន៍', hex: '#d8c3a5', border: '#f59e0b' },
  { name: 'លឿង', hex: '#eab308', border: '#facc15' },
  { name: 'ទឹកក្រូច', hex: '#ea580c', border: '#f97316' },
  { name: 'ផ្កាឈូក', hex: '#ec4899', border: '#f472b6' },
  { name: 'ស្វាយ', hex: '#9333ea', border: '#a855f7' },
];

const getColorHex = (colorName: string): string => {
  const norm = colorName.trim().toLowerCase();
  if (norm === 'ខ្មៅ' || norm === 'black') return '#0f172a';
  if (norm === 'ស' || norm === 'white') return '#ffffff';
  if (norm === 'navy' || norm === 'ខៀវ' || norm === 'blue') return '#1e40af';
  if (norm === 'ក្រហម' || norm === 'red') return '#dc2626';
  if (norm === 'ប្រផេះ' || norm === 'grey' || norm === 'gray') return '#64748b';
  if (norm === 'ត្នោត' || norm === 'brown') return '#78350f';
  if (norm === 'បៃតង' || norm === 'green') return '#16a34a';
  if (norm === 'beige' || norm === 'បន៍') return '#d8c3a5';
  if (norm === 'លឿង' || norm === 'yellow') return '#eab308';
  if (norm === 'ទឹកក្រូច' || norm === 'orange') return '#ea580c';
  if (norm === 'ផ្កាឈូក' || norm === 'pink') return '#ec4899';
  if (norm === 'ស្វាយ' || norm === 'purple') return '#9333ea';
  return '#f59e0b';
};

const INITIAL_COLORWAYS: ColorwayDraft[] = [
  { id: 'cw-1', colorName: 'ខ្មៅ', colorHex: '#0f172a', image: '', sizes: [...INITIAL_SIZES.map(s => ({ ...s }))] },
  { id: 'cw-2', colorName: 'ស', colorHex: '#ffffff', image: '', sizes: [...INITIAL_SIZES.map(s => ({ ...s }))] },
];

export const AddProductModal: React.FC<AddProductModalProps> = ({
  isOpen,
  onClose
}) => {
  const { 
    products, 
    addProduct, 
    categories: registeredCategories, 
    modelSkus: registeredSkus
  } = useInventory();
  const { user, uploadProductPhoto, syncDataToGoogle } = useGoogleAuth();
  const [isSavingWithDrive, setIsSavingWithDrive] = useState(false);

  // Basic Information
  const [name, setName] = useState('');
  const [gender, setGender] = useState<ShoeGender>('men');
  
  // Model SKUs & Category State
  const skuList = registeredSkus;
  const [sku, setSku] = useState<string>(registeredSkus[0] || '');

  const categories = registeredCategories;
  const [category, setCategory] = useState<string>(registeredCategories[0] || '');

  const [costPrice, setCostPrice] = useState<number>(0);
  const [retailPrice, setRetailPrice] = useState<number>(0);

  // Camera State for Colorways
  const [isCameraOpen, setIsCameraOpen] = useState<boolean>(false);
  const [cameraTarget, setCameraTarget] = useState<string>('');

  // Colorways & Sizes State
  const [colorways, setColorways] = useState<ColorwayDraft[]>(INITIAL_COLORWAYS);
  const [newColorwayName, setNewColorwayName] = useState('ខៀវ');
  const [selectedColorHex, setSelectedColorHex] = useState<string>('#1e40af');
  const [isAddingCustomColor, setIsAddingCustomColor] = useState(false);

  const colorwayFileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  if (!isOpen) return null;

  // Handle local image file upload for a specific Colorway
  const handleColorwayFileUpload = (colorwayId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        const photoUrl = event.target.result as string;
        setColorways(prev => prev.map(cw => cw.id === colorwayId ? { ...cw, image: photoUrl } : cw));
      }
    };
    reader.readAsDataURL(file);
  };

  // Handle direct camera snapshot
  const handleCameraPhoto = (dataUrl: string) => {
    if (cameraTarget) {
      setColorways(prev => prev.map(cw => cw.id === cameraTarget ? { ...cw, image: dataUrl } : cw));
    }
    setIsCameraOpen(false);
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

  // Colorways Management
  const handleAddColorway = (customName?: string, customHex?: string) => {
    const nameToUse = (customName !== undefined ? customName : newColorwayName).trim();
    if (!nameToUse) return;
    const hexToUse = customHex || selectedColorHex || getColorHex(nameToUse);
    const currentSizes = gender === 'women'
      ? [36, 37, 38, 39, 40]
      : [40, 41, 42, 43, 44];

    const newCw: ColorwayDraft = {
      id: `cw-${Date.now()}`,
      colorName: nameToUse,
      colorHex: hexToUse,
      image: '',
      sizes: currentSizes.map(sz => ({ size: sz, stock: 0 }))
    };
    setColorways(prev => [...prev, newCw]);
    setNewColorwayName('ខៀវ');
    setSelectedColorHex('#1e40af');
    setIsAddingCustomColor(false);
  };

  const handleRemoveColorway = (id: string) => {
    if (colorways.length <= 1) {
      alert('Product must have at least one colorway.');
      return;
    }
    setColorways(prev => prev.filter(cw => cw.id !== id));
  };

  const handleSizeStockChange = (colorwayId: string, sizeNum: number, newStock: number) => {
    setColorways(prev => prev.map(cw => {
      if (cw.id !== colorwayId) return cw;
      return {
        ...cw,
        sizes: cw.sizes.map(s => s.size === sizeNum ? { ...s, stock: Math.max(0, newStock) } : s)
      };
    }));
  };

  const handleAddSizeToColorway = (colorwayId: string, sizeNum: number) => {
    setColorways(prev => prev.map(cw => {
      if (cw.id !== colorwayId) return cw;
      if (cw.sizes.some(s => s.size === sizeNum)) return cw;
      const updatedSizes = [...cw.sizes, { size: sizeNum, stock: 0 }].sort((a, b) => a.size - b.size);
      return { ...cw, sizes: updatedSizes };
    }));
  };

  const handleRemoveSizeFromColorway = (colorwayId: string, sizeNum: number) => {
    setColorways(prev => prev.map(cw => {
      if (cw.id !== colorwayId) return cw;
      return {
        ...cw,
        sizes: cw.sizes.filter(s => s.size !== sizeNum)
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

    // If user is connected to Google, upload base64 colorway images to Google Drive
    const updatedColorways = [...colorways];
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

    // Build colorImages mapping and pick primary image
    const colorImagesMap: Partial<Record<ShoeColor, string>> = {};
    let firstAvailableColorImage = '';
    updatedColorways.forEach(cw => {
      if (cw.image) {
        colorImagesMap[cw.colorName as ShoeColor] = cw.image;
        if (!firstAvailableColorImage) {
          firstAvailableColorImage = cw.image;
        }
      }
    });

    const defaultShoeImg = firstAvailableColorImage 
      ? [firstAvailableColorImage] 
      : ['https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80'];

    // Generate full variants matrix from defined colorways and sizes
    const generatedVariants: ShoeVariant[] = updatedColorways.flatMap(cw => {
      const colorCode = cw.colorName.substring(0, 3).toUpperCase();
      return cw.sizes.map(s => ({
        sku: `${finalSku}-${colorCode}-${s.size}`,
        size: s.size,
        color: cw.colorName as ShoeColor,
        stock: Number(s.stock) || 0,
        minThreshold: 4,
        salesCount: 0
      }));
    });

    const createdProduct = addProduct({
      name: name.trim(),
      sku: finalSku,
      gender,
      category,
      costPrice: Number(costPrice) || 0,
      retailPrice: Number(retailPrice) || 0,
      images: defaultShoeImg,
      colorImages: colorImagesMap,
      description: `Modern ${category.toLowerCase()} crafted for superior durability, breathability, and all-day comfort.`,
      specifications: {
        upperMaterial: 'Premium Full-Grain Leather & Mesh',
        soleMaterial: 'Anti-Slip Dual Density Rubber EVA',
        cushioning: 'High Rebound Memory Foam Insole',
        weightGrams: 320,
        origin: 'SoleTrack Artisan Atelier',
        careInstructions: 'Wipe with damp cloth and dry in shade.'
      },
      tags: ['New Arrival', category],
      variants: generatedVariants
    });

    setIsSavingWithDrive(false);
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md overflow-y-auto animate-in fade-in">
        <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-700/80 rounded-2xl overflow-hidden shadow-2xl my-auto">
          
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/70">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
                <Plus className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white tracking-tight">Add New Shoe Product</h2>
                <p className="text-xs text-slate-400">
                  Publish a new shoe model and manage colorways, photos & sizes
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              {user && (
                <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 text-[11px] font-semibold">
                  <Cloud className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Google Drive Photos Sync Active</span>
                </div>
              )}
              <button
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[82vh] overflow-y-auto">
            
            {/* Top Product Information Block */}
            <div className="space-y-4">
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
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2.5 text-xs font-semibold text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              {/* Gender Selector (Below Product Name) */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Gender & Size Standard
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => handleGenderChange('men')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-1.5 ${
                      gender === 'men'
                        ? 'bg-amber-500/20 border-amber-400 text-amber-300 ring-1 ring-amber-400/40 shadow-sm'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                    }`}
                  >
                    <span>Men (40–44)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleGenderChange('women')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-1.5 ${
                      gender === 'women'
                        ? 'bg-amber-500/20 border-amber-400 text-amber-300 ring-1 ring-amber-400/40 shadow-sm'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                    }`}
                  >
                    <span>Women (36–40)</span>
                  </button>
                </div>
              </div>

              {/* Model SKU & Category Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Model SKU */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Model SKU
                  </label>
                  <select
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value="">-- Select SKU --</option>
                    {skuList.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                {/* Shoe Category */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Shoe Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                  >
                    {categories.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Pricing (Cost Price & Retail Price only) */}
              <div className="grid grid-cols-2 gap-3.5 p-3.5 bg-slate-950 rounded-xl border border-slate-800">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">
                    Cost Price (៛)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="1000"
                      min="0"
                      value={costPrice}
                      onChange={(e) => setCostPrice(parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs font-bold text-white focus:outline-none focus:border-amber-400"
                    />
                    <span className="absolute right-2.5 top-2 text-slate-500 text-xs">៛</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">
                    Retail Price (៛)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="1000"
                      min="0"
                      value={retailPrice}
                      onChange={(e) => setRetailPrice(parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs font-bold text-amber-400 focus:outline-none focus:border-amber-400"
                    />
                    <span className="absolute right-2.5 top-2 text-amber-500/70 text-xs font-bold">៛</span>
                  </div>
                </div>
              </div>
            </div>

            {/* SHOE COLORWAYS & SIZES SECTION */}
            <div className="pt-4 border-t border-slate-800 space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
                    <Palette className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white tracking-tight">Shoe Colors, Photos & Size Matrix</h3>
                    <p className="text-[11px] text-slate-400">
                      Select color icons, upload photos per colorway, and configure in-stock pairs per shoe size
                    </p>
                  </div>
                </div>

                {/* Add Custom Colorway button */}
                {!isAddingCustomColor && (
                  <button
                    type="button"
                    onClick={() => setIsAddingCustomColor(true)}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1.5 transition-colors shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Add Colorway</span>
                  </button>
                )}
              </div>

              {/* Interactive Color Selector & Swatch Bar when adding color */}
              {isAddingCustomColor && (
                <div className="p-3.5 bg-slate-950/90 border border-amber-500/40 rounded-2xl space-y-3 animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                      <Palette className="w-3.5 h-3.5 text-amber-400" />
                      <span>Select Color Icon & Swatch</span>
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Click a color dot or pick custom color
                    </span>
                  </div>

                  {/* Color Swatch Circle Icons */}
                  <div className="flex items-center gap-2 flex-wrap pb-1">
                    {COLOR_PRESETS.map((preset) => {
                      const isSelected = selectedColorHex.toLowerCase() === preset.hex.toLowerCase() || newColorwayName === preset.name;
                      return (
                        <button
                          key={preset.name}
                          type="button"
                          onClick={() => {
                            setSelectedColorHex(preset.hex);
                            setNewColorwayName(preset.name);
                          }}
                          className={`flex items-center gap-1.5 px-2 py-1 rounded-xl border text-xs font-bold transition-all ${
                            isSelected 
                              ? 'bg-amber-500/20 border-amber-400 text-amber-300 ring-2 ring-amber-400/40' 
                              : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-600'
                          }`}
                          title={`${preset.name}`}
                        >
                          <span 
                            className="w-3.5 h-3.5 rounded-full border shadow-sm flex-shrink-0"
                            style={{ backgroundColor: preset.hex, borderColor: preset.border }}
                          />
                          <span>{preset.name}</span>
                        </button>
                      );
                    })}

                    {/* Custom HTML Color Picker Icon */}
                    <label 
                      className="relative flex items-center gap-1.5 px-2.5 py-1 rounded-xl border border-slate-700 bg-slate-900 hover:border-amber-400 text-xs text-slate-300 font-bold cursor-pointer transition-colors"
                      title="Custom Color Picker"
                    >
                      <span 
                        className="w-3.5 h-3.5 rounded-full border border-white/40 shadow-sm"
                        style={{ backgroundColor: selectedColorHex }}
                      />
                      <span>Custom</span>
                      <input 
                        type="color"
                        value={selectedColorHex}
                        onChange={(e) => {
                          setSelectedColorHex(e.target.value);
                          if (!newColorwayName) setNewColorwayName('Custom');
                        }}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                      />
                    </label>
                  </div>

                  {/* Input & Action Buttons */}
                  <div className="flex items-center gap-2 pt-1">
                    <div className="relative flex-1 flex items-center">
                      <span 
                        className="absolute left-3 w-3.5 h-3.5 rounded-full border shadow-sm"
                        style={{ backgroundColor: selectedColorHex, borderColor: 'rgba(255,255,255,0.4)' }}
                      />
                      <input
                        type="text"
                        placeholder="Color name (e.g. ខ្មៅ, ស, ខៀវ, ក្រហម...)"
                        value={newColorwayName}
                        onChange={(e) => setNewColorwayName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddColorway();
                          }
                        }}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 font-semibold"
                        autoFocus
                      />
                    </div>
                    
                    <button
                      type="button"
                      onClick={() => handleAddColorway()}
                      className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl transition-colors shadow-sm flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Colorway</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsAddingCustomColor(false);
                        setNewColorwayName('ខៀវ');
                      }}
                      className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-xl transition-colors font-semibold"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Colorways Cards List */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {colorways.map((cw) => {
                  const totalColorStock = cw.sizes.reduce((sum, s) => sum + (Number(s.stock) || 0), 0);
                  const effectiveColorHex = cw.colorHex || getColorHex(cw.colorName);
                  
                  return (
                    <div 
                      key={cw.id} 
                      className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 space-y-3.5 shadow-md relative group hover:border-slate-700 transition-colors"
                    >
                      {/* Colorway Header & Actions */}
                      <div className="flex items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5">
                        <div className="flex items-center gap-2">
                          <span 
                            className="w-3.5 h-3.5 rounded-full border flex-shrink-0 shadow-sm"
                            style={{ 
                              backgroundColor: effectiveColorHex,
                              borderColor: 'rgba(255,255,255,0.35)'
                            }}
                          />
                          <span className="text-xs font-bold text-white">{cw.colorName}</span>
                          <span className="text-[10px] text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                            {totalColorStock} pairs
                          </span>
                        </div>

                        <div className="flex items-center gap-1">
                          {/* Quick Fill Stock */}
                          <button
                            type="button"
                            onClick={() => {
                              const amount = prompt(`Set stock quantity for all sizes of ${cw.colorName}:`, '10');
                              if (amount !== null) {
                                const parsed = parseInt(amount);
                                if (!isNaN(parsed) && parsed >= 0) {
                                  handleFillAllStock(cw.id, parsed);
                                }
                              }
                            }}
                            className="text-[10px] text-slate-400 hover:text-slate-200 bg-slate-900 px-2 py-0.5 rounded border border-slate-800 transition-colors"
                            title="Set same stock quantity for all sizes"
                          >
                            Set All Stock
                          </button>

                          {/* Delete Colorway */}
                          <button
                            type="button"
                            onClick={() => handleRemoveColorway(cw.id)}
                            className="p-1 text-slate-500 hover:text-rose-400 rounded transition-colors"
                            title="Remove colorway"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Photo Upload for Colorway */}
                      <div className="flex items-center gap-3">
                        <div className="relative w-20 h-20 rounded-xl bg-slate-900 border border-slate-800 overflow-hidden flex items-center justify-center shrink-0">
                          {cw.image ? (
                            <>
                              <img src={cw.image} alt={cw.colorName} className="w-full h-full object-cover" />
                              <button
                                type="button"
                                onClick={() => setColorways(prev => prev.map(c => c.id === cw.id ? { ...c, image: '' } : c))}
                                className="absolute top-1 right-1 p-0.5 bg-rose-600/90 text-white rounded-full hover:bg-rose-700"
                                title="Remove color photo"
                              >
                                <Trash2 className="w-2.5 h-2.5" />
                              </button>
                            </>
                          ) : (
                            <div className="text-center p-1 text-slate-600">
                              <ImageIcon className="w-6 h-6 mx-auto mb-0.5 text-slate-700" />
                              <span className="text-[9px] text-slate-500">No Photo</span>
                            </div>
                          )}
                        </div>

                        <div className="flex-1 space-y-1.5">
                          <p className="text-[11px] font-medium text-slate-300">
                            {cw.colorName} Photo
                          </p>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setCameraTarget(cw.id);
                                setIsCameraOpen(true);
                              }}
                              className="px-2.5 py-1 rounded-lg border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-300 text-[11px] font-semibold flex items-center gap-1 transition-colors"
                            >
                              <Camera className="w-3 h-3 text-amber-400" />
                              <span>Camera</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => colorwayFileInputRefs.current[cw.id]?.click()}
                              className="px-2.5 py-1 rounded-lg border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-300 text-[11px] font-semibold flex items-center gap-1 transition-colors"
                            >
                              <Upload className="w-3 h-3 text-amber-400" />
                              <span>Upload</span>
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
                      </div>

                      {/* Sizes & Stock Inputs */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
                          <span>Sizes & In-Stock Pairs:</span>
                          <span className="text-[10px] text-slate-500">{cw.sizes.length} sizes</span>
                        </div>

                        <div className="grid grid-cols-5 gap-1.5">
                          {cw.sizes.map((s) => (
                            <div 
                              key={s.size} 
                              className="bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-center relative group/size focus-within:border-amber-400"
                            >
                              <div className="text-[11px] font-bold text-slate-200">
                                Size {s.size}
                              </div>
                              <input
                                type="number"
                                min="0"
                                value={s.stock}
                                onChange={(e) => handleSizeStockChange(cw.id, s.size, parseInt(e.target.value) || 0)}
                                className="w-full bg-slate-950 border border-slate-800 rounded px-1 py-0.5 text-center text-xs font-bold text-amber-400 focus:outline-none focus:border-amber-400 mt-1"
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

            {/* Bottom Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="py-2.5 px-5 rounded-xl border border-slate-700 bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSavingWithDrive}
                className="py-2.5 px-6 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 text-xs font-bold flex items-center gap-2 transition-all shadow-lg shadow-amber-500/20 active:scale-95"
              >
                {isSavingWithDrive ? (
                  <>
                    <Cloud className="w-4 h-4 animate-bounce" />
                    <span>Uploading Photos to Drive...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Publish Shoe to Inventory</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Camera Capture Modal */}
      <CameraCaptureModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={handleCameraPhoto}
      />
    </>
  );
};
