import React, { useState } from 'react';
import { 
  Layers,
  Search, 
  Edit2, 
  Trash2, 
  Plus, 
  Check, 
  X, 
  Tag, 
  Package, 
  AlertCircle,
  FolderPlus,
  FileCode,
  Sparkles
} from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { ShoeProduct, ShoeGender } from '../types';
import { formatRiel } from '../utils/currency';

interface CatalogManagerViewProps {
  onOpenAddModal: () => void;
}

export const CatalogManagerView: React.FC<CatalogManagerViewProps> = () => {
  const { 
    products, 
    updateProduct, 
    deleteProduct,
    categories,
    modelSkus,
    addCategory,
    updateCategory,
    deleteCategory,
    addModelSku,
    updateModelSku,
    deleteModelSku
  } = useInventory();

  const [activeTab, setActiveTab] = useState<'skus' | 'categories' | 'products'>('skus');

  // New Category / SKU Input State
  const [newCategoryInput, setNewCategoryInput] = useState('');
  const [newSkuInput, setNewSkuInput] = useState('');

  // Category Edit State
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editCategoryName, setEditCategoryName] = useState('');

  // SKU Edit State
  const [editingSku, setEditingSku] = useState<string | null>(null);
  const [editSkuCode, setEditSkuCode] = useState('');

  // Product Filter & Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [selectedGenderFilter, setSelectedGenderFilter] = useState<string>('all');

  // Product Editing State
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editSku, setEditSku] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editGender, setEditGender] = useState<ShoeGender>('unisex');
  const [editCost, setEditCost] = useState<number>(0);
  const [editRetail, setEditRetail] = useState<number>(0);

  // Handle Adding New Category
  const handleAddCategorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryInput.trim()) return;
    addCategory(newCategoryInput.trim());
    setNewCategoryInput('');
  };

  // Handle Adding New SKU
  const handleAddSkuSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSkuInput.trim()) return;
    addModelSku(newSkuInput.trim().toUpperCase());
    setNewSkuInput('');
  };

  // Save Category Edit
  const handleSaveCategoryEdit = (oldName: string) => {
    if (!editCategoryName.trim()) return;
    updateCategory(oldName, editCategoryName.trim());
    setEditingCategory(null);
  };

  // Save SKU Edit
  const handleSaveSkuEdit = (oldSku: string) => {
    if (!editSkuCode.trim()) return;
    updateModelSku(oldSku, editSkuCode.trim().toUpperCase());
    setEditingSku(null);
  };

  // Save Product Edit
  const handleSaveProductEdit = (p: ShoeProduct) => {
    if (!editName.trim() || !editSku.trim()) {
      alert('Model name and SKU code cannot be empty.');
      return;
    }
    const updated: ShoeProduct = {
      ...p,
      name: editName.trim(),
      sku: editSku.trim().toUpperCase(),
      category: editCategory.trim() || 'Sneakers',
      gender: editGender,
      costPrice: Number(editCost) || 0,
      retailPrice: Number(editRetail) || 0
    };
    updateProduct(updated);
    setEditingProductId(null);
  };

  const handleStartProductEdit = (p: ShoeProduct) => {
    setEditingProductId(p.id);
    setEditName(p.name);
    setEditSku(p.sku);
    setEditCategory(p.category);
    setEditGender(p.gender || 'unisex');
    setEditCost(p.costPrice);
    setEditRetail(p.retailPrice);
  };

  // Filtered products list
  const filteredProducts = products.filter(p => {
    const matchesSearch = 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategoryFilter === 'all' || p.category === selectedCategoryFilter;
    const matchesGender = selectedGenderFilter === 'all' || p.gender === selectedGenderFilter;
    return matchesSearch && matchesCategory && matchesGender;
  });

  return (
    <div className="space-y-6">
      {/* Tabs Switcher */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
        <button
          type="button"
          onClick={() => setActiveTab('skus')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'skus'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          <FileCode className="w-4 h-4" />
          <span>Model SKUs ({modelSkus.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('categories')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'categories'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          <FolderPlus className="w-4 h-4" />
          <span>Shoe Categories ({categories.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('products')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'products'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>All Models ({products.length})</span>
        </button>
      </div>

      {/* TAB 1: MODEL SKUS MANAGER */}
      {activeTab === 'skus' && (
        <div className="space-y-6">
          {/* Add New SKU Form */}
          <form onSubmit={handleAddSkuSubmit} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center gap-3 shadow-lg">
            <div className="flex-1 w-full">
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Add New Model SKU Code
              </label>
              <div className="relative">
                <FileCode className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="e.g. SHOE-01, LAIZA-RUNNER, ST-JORDAN..."
                  value={newSkuInput}
                  onChange={(e) => setNewSkuInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs font-mono font-bold text-amber-400 placeholder:text-slate-600 focus:outline-none focus:border-amber-400 uppercase"
                />
              </div>
            </div>
            <button
              type="submit"
              className="w-full sm:w-auto mt-2 sm:mt-5 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md shadow-amber-500/10 shrink-0"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Add Model SKU</span>
            </button>
          </form>

          {/* Model SKUs List */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white font-['Syne'] flex items-center gap-2">
                <Tag className="w-4 h-4 text-amber-400" />
                <span>Registered Model SKUs</span>
              </h3>
              <span className="text-xs text-slate-400">{modelSkus.length} registered</span>
            </div>

            {modelSkus.length === 0 ? (
              <div className="text-center py-12 bg-slate-950 rounded-xl border border-slate-800 p-6 space-y-2">
                <AlertCircle className="w-8 h-8 text-slate-600 mx-auto" />
                <p className="text-xs font-bold text-slate-300">No Model SKUs Registered</p>
                <p className="text-[11px] text-slate-500">Type a new SKU code above to create your first Model SKU.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {modelSkus.map(skuCode => {
                  const isEditing = editingSku === skuCode;
                  const associatedProducts = products.filter(p => p.sku === skuCode);

                  return (
                    <div 
                      key={skuCode}
                      className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 flex items-center justify-between gap-2 hover:border-slate-700 transition-colors"
                    >
                      {isEditing ? (
                        <div className="flex items-center gap-2 w-full">
                          <input
                            type="text"
                            value={editSkuCode}
                            onChange={(e) => setEditSkuCode(e.target.value)}
                            className="bg-slate-900 border border-amber-400 rounded-lg px-2.5 py-1 text-xs text-white uppercase font-mono font-bold w-full focus:outline-none"
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={() => handleSaveSkuEdit(skuCode)}
                            className="p-1.5 bg-emerald-500 text-slate-950 rounded-lg font-bold hover:bg-emerald-400 cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingSku(null)}
                            className="p-1.5 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <div>
                            <span className="font-mono font-bold text-xs text-amber-400 block uppercase">
                              {skuCode}
                            </span>
                            <span className="text-[10px] text-slate-500">
                              {associatedProducts.length} shoe model{associatedProducts.length !== 1 ? 's' : ''}
                            </span>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingSku(skuCode);
                                setEditSkuCode(skuCode);
                              }}
                              className="p-1.5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                              title="Rename SKU"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (confirm(`Remove Model SKU "${skuCode}"?`)) {
                                  deleteModelSku(skuCode);
                                }
                              }}
                              className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg transition-colors cursor-pointer"
                              title="Delete SKU"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: SHOE CATEGORIES MANAGER */}
      {activeTab === 'categories' && (
        <div className="space-y-6">
          {/* Add New Category Form */}
          <form onSubmit={handleAddCategorySubmit} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center gap-3 shadow-lg">
            <div className="flex-1 w-full">
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Add New Shoe Category Name
              </label>
              <div className="relative">
                <FolderPlus className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="e.g. High Tops, Sandals, Platform Sneakers..."
                  value={newCategoryInput}
                  onChange={(e) => setNewCategoryInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs font-bold text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>
            <button
              type="submit"
              className="w-full sm:w-auto mt-2 sm:mt-5 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md shadow-amber-500/10 shrink-0"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Add Category</span>
            </button>
          </form>

          {/* Categories List */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white font-['Syne'] flex items-center gap-2">
                <Layers className="w-4 h-4 text-amber-400" />
                <span>Registered Shoe Categories</span>
              </h3>
              <span className="text-xs text-slate-400">{categories.length} registered</span>
            </div>

            {categories.length === 0 ? (
              <div className="text-center py-12 bg-slate-950 rounded-xl border border-slate-800 p-6 space-y-2">
                <AlertCircle className="w-8 h-8 text-slate-600 mx-auto" />
                <p className="text-xs font-bold text-slate-300">No Categories Registered</p>
                <p className="text-[11px] text-slate-500">Type a new category name above to create your first category.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {categories.map(categoryName => {
                  const isEditing = editingCategory === categoryName;
                  const associatedProducts = products.filter(p => p.category === categoryName);

                  return (
                    <div 
                      key={categoryName}
                      className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 flex items-center justify-between gap-2 hover:border-slate-700 transition-colors"
                    >
                      {isEditing ? (
                        <div className="flex items-center gap-2 w-full">
                          <input
                            type="text"
                            value={editCategoryName}
                            onChange={(e) => setEditCategoryName(e.target.value)}
                            className="bg-slate-900 border border-amber-400 rounded-lg px-2.5 py-1 text-xs text-white font-bold w-full focus:outline-none"
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={() => handleSaveCategoryEdit(categoryName)}
                            className="p-1.5 bg-emerald-500 text-slate-950 rounded-lg font-bold hover:bg-emerald-400 cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingCategory(null)}
                            className="p-1.5 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <div>
                            <span className="font-bold text-xs text-white block">
                              {categoryName}
                            </span>
                            <span className="text-[10px] text-slate-500">
                              {associatedProducts.length} shoe model{associatedProducts.length !== 1 ? 's' : ''}
                            </span>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingCategory(categoryName);
                                setEditCategoryName(categoryName);
                              }}
                              className="p-1.5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                              title="Rename Category"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (confirm(`Remove Category "${categoryName}"?`)) {
                                  deleteCategory(categoryName);
                                }
                              }}
                              className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg transition-colors cursor-pointer"
                              title="Delete Category"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: ALL SHOE MODELS LIST */}
      {activeTab === 'products' && (
        <div className="space-y-4">
          {/* Search & Filter Toolbar */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row items-stretch md:items-center gap-3 shadow-lg">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by Model Name, SKU, or Category..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400 transition-colors"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={selectedCategoryFilter}
                onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 text-slate-200 text-xs font-semibold rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-amber-400 transition-colors cursor-pointer"
              >
                <option value="all">All Categories</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>

              <select
                value={selectedGenderFilter}
                onChange={(e) => setSelectedGenderFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 text-slate-200 text-xs font-semibold rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-amber-400 transition-colors cursor-pointer uppercase"
              >
                <option value="all">All Genders</option>
                <option value="men">Men</option>
                <option value="women">Women</option>
                <option value="unisex">Unisex</option>
              </select>
            </div>
          </div>

          {/* Products Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-950 border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="py-3.5 px-4">Shoe Model & Image</th>
                    <th className="py-3.5 px-4">SKU Code</th>
                    <th className="py-3.5 px-4">Category</th>
                    <th className="py-3.5 px-4">Gender</th>
                    <th className="py-3.5 px-4 text-center">Total Stock</th>
                    <th className="py-3.5 px-4 text-right">Cost / Retail (៛)</th>
                    <th className="py-3.5 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-xs">
                  {filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-500">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <AlertCircle className="w-8 h-8 text-slate-600" />
                          <p>No shoe models found matching your search or filters.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map(p => {
                      const isEditing = editingProductId === p.id;
                      const primaryImg = p.images?.[0] || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=100';

                      if (isEditing) {
                        return (
                          <tr key={p.id} className="bg-slate-800/40">
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-3">
                                <img src={primaryImg} alt={p.name} className="w-10 h-10 rounded-lg object-cover bg-slate-950 border border-slate-700" />
                                <input
                                  type="text"
                                  value={editName}
                                  onChange={(e) => setEditName(e.target.value)}
                                  className="bg-slate-950 border border-amber-500 rounded-lg px-2.5 py-1.5 text-white w-full focus:outline-none text-xs"
                                  placeholder="Model Name"
                                />
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <input
                                type="text"
                                value={editSku}
                                onChange={(e) => setEditSku(e.target.value)}
                                className="bg-slate-950 border border-amber-500 rounded-lg px-2.5 py-1.5 text-white uppercase w-28 focus:outline-none text-xs font-mono"
                                placeholder="SKU"
                              />
                            </td>
                            <td className="py-3 px-4">
                              <input
                                type="text"
                                value={editCategory}
                                onChange={(e) => setEditCategory(e.target.value)}
                                className="bg-slate-950 border border-amber-500 rounded-lg px-2.5 py-1.5 text-white w-32 focus:outline-none text-xs"
                                placeholder="Category"
                              />
                            </td>
                            <td className="py-3 px-4">
                              <select
                                value={editGender}
                                onChange={(e) => setEditGender(e.target.value as ShoeGender)}
                                className="bg-slate-950 border border-amber-500 rounded-lg px-2 py-1.5 text-white text-xs focus:outline-none uppercase"
                              >
                                <option value="men">Men</option>
                                <option value="women">Women</option>
                                <option value="unisex">Unisex</option>
                              </select>
                            </td>
                            <td className="py-3 px-4 text-center text-slate-400 font-bold">
                              {p.totalStock} pairs
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <input
                                  type="number"
                                  value={editCost}
                                  onChange={(e) => setEditCost(Number(e.target.value))}
                                  className="w-20 bg-slate-950 border border-amber-500 rounded-lg px-2 py-1 text-right text-xs text-white"
                                  title="Cost Price (៛)"
                                />
                                <span className="text-slate-500">/</span>
                                <input
                                  type="number"
                                  value={editRetail}
                                  onChange={(e) => setEditRetail(Number(e.target.value))}
                                  className="w-20 bg-slate-950 border border-amber-500 rounded-lg px-2 py-1 text-right text-xs text-white"
                                  title="Retail Price (៛)"
                                />
                              </div>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleSaveProductEdit(p)}
                                  className="p-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-lg font-bold transition-colors cursor-pointer"
                                  title="Save changes"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingProductId(null)}
                                  className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors cursor-pointer"
                                  title="Cancel"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      }

                      return (
                        <tr key={p.id} className="hover:bg-slate-800/30 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <img src={primaryImg} alt={p.name} className="w-10 h-10 rounded-lg object-cover bg-slate-950 border border-slate-800 shrink-0" />
                              <div>
                                <span className="font-bold text-white block">{p.name}</span>
                                <span className="text-[10px] text-slate-500">Added {new Date(p.createdAt).toLocaleDateString()}</span>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 font-mono font-bold text-amber-400">
                            {p.sku}
                          </td>
                          <td className="py-3 px-4">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 text-[11px] font-semibold border border-slate-700/50">
                              {p.category}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-300 uppercase text-[11px] font-bold">
                            {p.gender || 'unisex'}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                              p.totalStock > 10 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                              p.totalStock > 0 ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                              'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            }`}>
                              {p.totalStock} pairs
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right font-mono">
                            <span className="text-slate-400">{formatRiel(p.costPrice)}</span>
                            <span className="text-slate-600 mx-1">→</span>
                            <span className="text-emerald-400 font-bold">{formatRiel(p.retailPrice)}</span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleStartProductEdit(p)}
                                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition-colors cursor-pointer"
                                title="Edit Model, SKU & Category"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  if (confirm(`Are you sure you want to delete "${p.name}"?`)) {
                                    deleteProduct(p.id);
                                  }
                                }}
                                className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg transition-colors cursor-pointer"
                                title="Delete Product"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
