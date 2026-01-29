import React, { useEffect, useState, useMemo } from 'react';
/* eslint-disable react-hooks/exhaustive-deps */
import { useNavigate } from 'react-router-dom';
import { inventoryApi, supplierApi } from '../../api/pharmacy';
import { 
  ArrowLeft, Plus, Edit, Trash2, Search, AlertTriangle, 
  Calendar, Filter, X, ChevronDown, Download, RefreshCw, 
  Package, DollarSign, MoreVertical, FileText 
} from 'lucide-react';

// --- Interfaces ---
interface Supplier {
  id: number;
  name: string;
}

interface InventoryItem {
  id: number;
  name: string;
  generic_name?: string;
  brand_name?: string;
  category?: string;
  unit: string;
  quantity: number;
  reorder_level: number;
  unit_price: number;
  selling_price: number;
  expiry_date?: string;
  batch_number?: string;
  description?: string;
  supplier?: Supplier;
  updated_at?: string;
}

// --- Status Badge Component ---
const StatusBadge = ({ quantity, reorderLevel, expiryDate }: { quantity: number, reorderLevel: number, expiryDate?: string }) => {
  const isLow = quantity <= reorderLevel;
  const isOut = quantity === 0;
  
  let isExpiring = false;
  if (expiryDate) {
    const days = Math.ceil((new Date(expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    isExpiring = days <= 30 && days > 0;
  }

  if (isOut) return <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-semibold border border-red-200">Out of Stock</span>;
  if (isExpiring) return <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-semibold border border-amber-200">Expiring Soon</span>;
  if (isLow) return <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-semibold border border-orange-200">Low Stock</span>;
  return <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold border border-green-200">In Stock</span>;
};

const InventoryManagement: React.FC = () => {
  const navigate = useNavigate();
  
  // --- State ---
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'low' | 'expiring'>('all');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [viewDetailsItem, setViewDetailsItem] = useState<InventoryItem | null>(null); // For read-only view
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  
  // Form State
  const [formData, setFormData] = useState({
    name: '', generic_name: '', brand_name: '', description: '',
    category: '', unit: 'Tablet', quantity: 0, reorder_level: 10,
    unit_price: 0, selling_price: 0, expiry_date: '',
    batch_number: '', supplier_id: '',
  });

  // --- Calculations for Dashboard ---
  const stats = useMemo(() => {
    return {
      totalItems: items.length,
      lowStock: items.filter(i => i.quantity <= i.reorder_level).length,
      totalValue: items.reduce((sum, i) => sum + (i.quantity * i.unit_price), 0),
      expiring: items.filter(i => {
        if (!i.expiry_date) return false;
        const days = Math.ceil((new Date(i.expiry_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        return days <= 30 && days > 0;
      }).length
    };
  }, [items]);

  // --- Data Loading ---
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    await Promise.all([loadItems(), loadSuppliers()]);
    setLoading(false);
  };

  const loadSuppliers = async () => {
    try {
      const data = await supplierApi.getAll();
      setSuppliers(Array.isArray(data.data) ? data.data : data);
    } catch (error) {
      console.error('Failed to load suppliers');
    }
  };

  const loadItems = async () => {
    try {
      setRefreshing(true);
      const params: any = {};
      if (searchTerm) params.search = searchTerm;
      if (selectedCategory) params.category = selectedCategory;
      if (filterStatus === 'low') params.low_stock = true;
      if (filterStatus === 'expiring') params.expiring_soon = true;
      
      const data = await inventoryApi.getAll(params);
      setItems(Array.isArray(data.data) ? data.data : data);
    } catch (error) {
      console.error('Failed to load items');
    } finally {
      setRefreshing(false);
    }
  };

  // --- Handlers ---
  const handleFilterChange = (type: 'all' | 'low' | 'expiring') => {
    setFilterStatus(type);
    // In a real app, you might want to trigger a useEffect or immediate fetch here
    // For client-side filtering of small datasets:
    // loadItems() is called via useEffect dependencies or manual trigger if API filtering is needed.
    // Here we will trigger loadItems manually via useEffect in real implementation, 
    // but for now, let's just trigger a re-fetch or filter client side if the API supports it.
  };

  useEffect(() => {
    loadItems();
  }, [searchTerm, selectedCategory, filterStatus]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await inventoryApi.update(editingItem.id.toString(), formData);
      } else {
        await inventoryApi.create(formData);
      }
      closeModal();
      loadItems();
    } catch (error) {
      alert('Failed to save item. Please check inputs.');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this inventory item? This action cannot be undone.')) return;
    try {
      await inventoryApi.delete(id.toString());
      loadItems();
    } catch (error) {
      alert('Failed to delete item');
    }
  };

  const openEditModal = (item: InventoryItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      generic_name: item.generic_name || '',
      brand_name: item.brand_name || '',
      description: item.description || '',
      category: item.category || '',
      unit: item.unit,
      quantity: item.quantity,
      reorder_level: item.reorder_level,
      unit_price: item.unit_price,
      selling_price: item.selling_price,
      expiry_date: item.expiry_date ? item.expiry_date.split('T')[0] : '',
      batch_number: item.batch_number || '',
      supplier_id: item.supplier?.id.toString() || '',
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingItem(null);
    setFormData({
      name: '', generic_name: '', brand_name: '', description: '',
      category: '', unit: 'Tablet', quantity: 0, reorder_level: 10,
      unit_price: 0, selling_price: 0, expiry_date: '',
      batch_number: '', supplier_id: '',
    });
  };

  // --- Render Helpers ---
  const categories = ["Pain Relief", "Antibiotics", "Cardiovascular", "Diabetes", "Respiratory", "Gastrointestinal", "Neurological", "Dermatological", "Vitamins", "First Aid"];
  const units = ["Tablet", "Capsule", "Syrup", "Injection", "Cream", "Drops", "Inhaler", "Box", "Piece"];

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-20">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <button onClick={() => navigate('/pharmacist')} className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Inventory</h1>
                <p className="text-sm text-gray-500">Manage stock, pricing, and suppliers</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => loadItems()} 
                className="p-2 text-gray-500 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                title="Refresh Data"
              >
                <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors shadow-sm">
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Export</span>
              </button>
              <button 
                onClick={() => setShowModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white rounded-lg font-medium shadow-md transition-all transform hover:scale-[1.02]"
              >
                <Plus className="w-4 h-4" />
                <span>Add New Item</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 space-y-6">
        
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Total Products</p>
              <h3 className="text-2xl font-bold text-gray-800">{stats.totalItems}</h3>
            </div>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Package className="w-6 h-6" />
            </div>
          </div>
          
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Inventory Value</p>
              <h3 className="text-2xl font-bold text-gray-800">${stats.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h3>
            </div>
            <div className="p-2 bg-green-50 text-green-600 rounded-lg">
              <DollarSign className="w-6 h-6" />
            </div>
          </div>

          <div 
            onClick={() => handleFilterChange('low')}
            className={`cursor-pointer p-5 rounded-xl shadow-sm border transition-all ${filterStatus === 'low' ? 'bg-orange-50 border-orange-200 ring-2 ring-orange-200' : 'bg-white border-gray-100 hover:border-orange-200'} flex items-start justify-between`}
          >
            <div>
              <p className={`text-sm font-medium mb-1 ${filterStatus === 'low' ? 'text-orange-700' : 'text-gray-500'}`}>Low Stock Alerts</p>
              <h3 className={`text-2xl font-bold ${filterStatus === 'low' ? 'text-orange-800' : 'text-gray-800'}`}>{stats.lowStock}</h3>
            </div>
            <div className="p-2 bg-orange-100 text-orange-600 rounded-lg">
              <AlertTriangle className="w-6 h-6" />
            </div>
          </div>

          <div 
            onClick={() => handleFilterChange('expiring')}
            className={`cursor-pointer p-5 rounded-xl shadow-sm border transition-all ${filterStatus === 'expiring' ? 'bg-red-50 border-red-200 ring-2 ring-red-200' : 'bg-white border-gray-100 hover:border-red-200'} flex items-start justify-between`}
          >
            <div>
              <p className={`text-sm font-medium mb-1 ${filterStatus === 'expiring' ? 'text-red-700' : 'text-gray-500'}`}>Expiring Soon</p>
              <h3 className={`text-2xl font-bold ${filterStatus === 'expiring' ? 'text-red-800' : 'text-gray-800'}`}>{stats.expiring}</h3>
            </div>
            <div className="p-2 bg-red-100 text-red-600 rounded-lg">
              <Calendar className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
            
            {/* Search */}
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input 
                type="text" 
                placeholder="Search by name, generic name, or brand..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
              />
            </div>

            {/* Filters */}
            <div className="flex w-full md:w-auto gap-3 overflow-x-auto pb-2 md:pb-0">
              <div className="relative min-w-[150px]">
                <select 
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full appearance-none pl-4 pr-10 py-2.5 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
                >
                  <option value="">All Categories</option>
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
              </div>
              
              <button 
                onClick={() => handleFilterChange('all')}
                className={`px-4 py-2.5 rounded-lg border font-medium whitespace-nowrap transition-colors ${filterStatus === 'all' ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}
              >
                All Items
              </button>
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="p-12 flex flex-col items-center justify-center">
              <div className="w-10 h-10 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin mb-4"></div>
              <p className="text-gray-500 font-medium">Loading inventory data...</p>
            </div>
          ) : items.length === 0 ? (
            <div className="p-16 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Package className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-bold text-gray-800 mb-1">No Items Found</h3>
              <p className="text-gray-500 max-w-sm mb-6">We couldn't find any inventory items matching your search criteria.</p>
              <button onClick={() => { setSearchTerm(''); setSelectedCategory(''); setFilterStatus('all'); }} className="text-teal-600 font-medium hover:underline">
                Clear all filters
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full whitespace-nowrap">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-left">
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Item Name</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Category</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Stock</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Price (Unit)</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {items.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50/80 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-semibold text-gray-800">{item.name}</span>
                          <span className="text-xs text-gray-500">{item.generic_name || item.brand_name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          {item.category || 'General'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge quantity={item.quantity} reorderLevel={item.reorder_level} expiryDate={item.expiry_date} />
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 font-medium">{item.quantity} <span className="text-gray-500 font-normal text-xs">{item.unit}</span></div>
                        {item.expiry_date && (
                          <div className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(item.expiry_date).toLocaleDateString()}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                         <div className="flex flex-col">
                           <span className="text-sm font-semibold text-gray-800">${item.selling_price.toFixed(2)}</span>
                           <span className="text-xs text-gray-400">Cost: ${item.unit_price.toFixed(2)}</span>
                         </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => setViewDetailsItem(item)} className="p-2 text-gray-500 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors" title="View Details">
                            <FileText className="w-4 h-4" />
                          </button>
                          <button onClick={() => openEditModal(item)} className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete(item.id)} className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* --- ADD / EDIT MODAL --- */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm transition-opacity">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <h2 className="text-xl font-bold text-gray-800">{editingItem ? 'Update Inventory' : 'Add New Product'}</h2>
              <button onClick={closeModal} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 md:p-8">
              <div className="space-y-8">
                {/* Basic Info Section */}
                <div>
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 border-b pb-2">Product Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Product Name *</label>
                      <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all" placeholder="e.g. Amoxicillin 500mg" />
                    </div>
                    <div>
                       <label className="block text-sm font-medium text-gray-700 mb-1.5">Category *</label>
                       <select required value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all">
                         <option value="">Select...</option>
                         {categories.map(c => <option key={c} value={c}>{c}</option>)}
                       </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Generic Name</label>
                      <input type="text" value={formData.generic_name} onChange={e => setFormData({...formData, generic_name: e.target.value})} className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 transition-all" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Brand Name</label>
                      <input type="text" value={formData.brand_name} onChange={e => setFormData({...formData, brand_name: e.target.value})} className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 transition-all" />
                    </div>
                    <div>
                       <label className="block text-sm font-medium text-gray-700 mb-1.5">Unit Type</label>
                       <select value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value})} className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 transition-all">
                         {units.map(u => <option key={u} value={u}>{u}</option>)}
                       </select>
                    </div>
                  </div>
                </div>

                {/* Stock & Pricing */}
                <div>
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 border-b pb-2">Stock & Pricing</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Quantity *</label>
                      <input type="number" min="0" required value={formData.quantity} onChange={e => setFormData({...formData, quantity: parseInt(e.target.value) || 0})} className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 transition-all" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Reorder Level *</label>
                      <input type="number" min="0" required value={formData.reorder_level} onChange={e => setFormData({...formData, reorder_level: parseInt(e.target.value) || 0})} className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 transition-all" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Cost Price ($) *</label>
                      <input type="number" min="0" step="0.01" required value={formData.unit_price} onChange={e => setFormData({...formData, unit_price: parseFloat(e.target.value) || 0})} className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 transition-all" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Selling Price ($) *</label>
                      <input type="number" min="0" step="0.01" required value={formData.selling_price} onChange={e => setFormData({...formData, selling_price: parseFloat(e.target.value) || 0})} className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 transition-all" />
                    </div>
                  </div>
                </div>

                {/* Tracking Info */}
                <div>
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 border-b pb-2">Tracking & Supplier</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Expiry Date</label>
                      <input type="date" value={formData.expiry_date} onChange={e => setFormData({...formData, expiry_date: e.target.value})} className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 transition-all" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Batch Number</label>
                      <input type="text" value={formData.batch_number} onChange={e => setFormData({...formData, batch_number: e.target.value})} className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 transition-all" placeholder="e.g. BATCH-001" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Supplier</label>
                      <select value={formData.supplier_id} onChange={e => setFormData({...formData, supplier_id: e.target.value})} className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 transition-all">
                        <option value="">Select Supplier</option>
                        {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </form>

            <div className="p-6 border-t border-gray-100 bg-gray-50 flex gap-4 justify-end">
              <button type="button" onClick={closeModal} className="px-6 py-2.5 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 focus:ring-4 focus:ring-gray-100 transition-all">
                Cancel
              </button>
              <button type="submit" onClick={handleSubmit} className="px-8 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-lg shadow-lg shadow-teal-500/30 focus:ring-4 focus:ring-teal-500/50 transition-all">
                {editingItem ? 'Save Changes' : 'Create Product'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- DETAILS MODAL --- */}
      {viewDetailsItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="bg-gradient-to-r from-teal-500 to-teal-600 p-6 text-white flex justify-between items-start">
              <div>
                <h2 className="text-xl font-bold">{viewDetailsItem.name}</h2>
                <p className="text-teal-100 text-sm mt-1">{viewDetailsItem.generic_name || 'No Generic Name'}</p>
              </div>
              <button onClick={() => setViewDetailsItem(null)} className="p-1 bg-white/20 hover:bg-white/30 rounded-full transition-colors">
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-500">Stock Status</span>
                <StatusBadge quantity={viewDetailsItem.quantity} reorderLevel={viewDetailsItem.reorder_level} expiryDate={viewDetailsItem.expiry_date} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="block text-xs text-gray-500 uppercase">Category</span>
                  <span className="text-sm font-medium text-gray-800">{viewDetailsItem.category}</span>
                </div>
                <div>
                  <span className="block text-xs text-gray-500 uppercase">Unit</span>
                  <span className="text-sm font-medium text-gray-800">{viewDetailsItem.unit}</span>
                </div>
                <div>
                  <span className="block text-xs text-gray-500 uppercase">Selling Price</span>
                  <span className="text-lg font-bold text-teal-600">${viewDetailsItem.selling_price.toFixed(2)}</span>
                </div>
                <div>
                  <span className="block text-xs text-gray-500 uppercase">Cost Price</span>
                  <span className="text-sm font-medium text-gray-800">${viewDetailsItem.unit_price.toFixed(2)}</span>
                </div>
                <div>
                  <span className="block text-xs text-gray-500 uppercase">Quantity</span>
                  <span className="text-sm font-medium text-gray-800">{viewDetailsItem.quantity}</span>
                </div>
                <div>
                  <span className="block text-xs text-gray-500 uppercase">Batch No.</span>
                  <span className="text-sm font-medium text-gray-800">{viewDetailsItem.batch_number || 'N/A'}</span>
                </div>
              </div>
              {viewDetailsItem.supplier && (
                <div className="pt-4 border-t border-gray-100">
                  <span className="block text-xs text-gray-500 uppercase mb-1">Supplier</span>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">
                      {viewDetailsItem.supplier.name.substring(0, 2).toUpperCase()}
                    </div>
                    <span className="text-sm font-medium text-gray-800">{viewDetailsItem.supplier.name}</span>
                  </div>
                </div>
              )}
            </div>
            <div className="p-4 border-t bg-gray-50 flex justify-end">
              <button onClick={() => { setViewDetailsItem(null); openEditModal(viewDetailsItem); }} className="px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 mr-2">Edit Item</button>
              <button onClick={() => setViewDetailsItem(null)} className="px-4 py-2 bg-gray-800 text-white text-sm font-medium rounded-lg hover:bg-gray-900">Close</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default InventoryManagement;