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
  Filter,
  AlertCircle
} from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { ShoeProduct, ShoeGender } from '../types';

interface CatalogManagerViewProps {
  onOpenAddModal: () => void;
}

export const CatalogManagerView: React.FC<CatalogManagerViewProps> = ({ onOpenAddModal }) => {
  const { products, updateProduct, deleteProduct } = useInventory();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedGender, setSelectedGender] = useState<string>('all');

  // Editing state
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editSku, setEditSku] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editGender, setEditGender] = useState<ShoeGender>('unisex');
  const [editCost, setEditCost] = useState<number>(0);
  const [editRetail, setEditRetail] = useState<number>(0);

  const categories = Array.from(new Set(products.map(p => p.category)));

  const filteredProducts = products.filter(p => {
    const matchesSearch = 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
    const matchesGender = selectedGender === 'all' || p.gender === selectedGender;
    return matchesSearch && matchesCategory && matchesGender;
  });

  const handleStartEdit = (p: ShoeProduct) => {
    setEditingProductId(p.id);
    setEditName(p.name);
    setEditSku(p.sku);
    setEditCategory(p.category);
    setEditGender(p.gender || 'unisex');
    setEditCost(p.costPrice);
    setEditRetail(p.retailPrice);
  };

  const handleSaveEdit = (p: ShoeProduct) => {
    if (!editName.trim() || !editSku.trim()) {
      alert('Model name and SKU cannot be empty.');
      return;
    }
    const updated: ShoeProduct = {
      ...p,
      name: editName.trim(),
      sku: editSku.trim().toUpperCase(),
      category: editCategory.trim() || 'Sneakers',
      gender: editGender,
      costPrice: Number(editCost) || p.costPrice,
      retailPrice: Number(editRetail) || p.retailPrice
    };
    updateProduct(updated);
    setEditingProductId(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white font-['Syne']">
              Model, SKU & Category Manager
            </h1>
            <p className="text-xs text-slate-400">
              Manage product titles, stock keeping units (SKUs), categories, and departmental classifications.
            </p>
          </div>
        </div>
        <button
          onClick={onOpenAddModal}
          className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-md shadow-amber-500/20 active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Add New Model</span>
        </button>
      </div>

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
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-slate-200 text-xs font-semibold rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-amber-400 transition-colors cursor-pointer"
          >
            <option value="all">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          <select
            value={selectedGender}
            onChange={(e) => setSelectedGender(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-slate-200 text-xs font-semibold rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-amber-400 transition-colors cursor-pointer uppercase"
          >
            <option value="all">All Genders</option>
            <option value="men">Men</option>
            <option value="women">Women</option>
            <option value="unisex">Unisex</option>
          </select>
        </div>
      </div>

      {/* Summary Count */}
      <div className="flex items-center justify-between px-1 text-xs text-slate-400">
        <span>Showing <strong className="text-white font-semibold">{filteredProducts.length}</strong> model entries</span>
        <span>SKU & Category Registry</span>
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
                <th className="py-3.5 px-4 text-right">Cost / Retail ($)</th>
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
                              className="w-16 bg-slate-950 border border-amber-500 rounded-lg px-2 py-1 text-right text-xs text-white"
                              title="Cost Price"
                            />
                            <span className="text-slate-500">/</span>
                            <input
                              type="number"
                              value={editRetail}
                              onChange={(e) => setEditRetail(Number(e.target.value))}
                              className="w-16 bg-slate-950 border border-amber-500 rounded-lg px-2 py-1 text-right text-xs text-white"
                              title="Retail Price"
                            />
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleSaveEdit(p)}
                              className="p-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-lg font-bold transition-colors"
                              title="Save changes"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setEditingProductId(null)}
                              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
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
                        <span className="text-slate-400">${p.costPrice}</span>
                        <span className="text-slate-600 mx-1">→</span>
                        <span className="text-emerald-400 font-bold">${p.retailPrice}</span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleStartEdit(p)}
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition-colors"
                            title="Edit Model, SKU & Category"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Are you sure you want to delete "${p.name}"?`)) {
                                deleteProduct(p.id);
                              }
                            }}
                            className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg transition-colors"
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
  );
};
