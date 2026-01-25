import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, AlertTriangle, ArrowLeft, Search, CheckCircle } from 'lucide-react';
import api from '../../api/axiosConfig';

interface Drug {
  id: number;
  name: string;
  stock: number;
  status: string; // 'Low Stock' or 'In Stock'
  expiry: string;
}

const Inventory: React.FC = () => {
  const navigate = useNavigate();
  const [drugs, setDrugs] = useState<Drug[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchInventory = async () => {
      try {
        const response = await api.get<Drug[]>('/admin/inventory');
        setDrugs(response.data);
      } catch (error) {
        console.error("Failed to load inventory", error);
      } finally {
        setLoading(false);
      }
    };
    fetchInventory();
  }, []);

  // Filter based on search
  const filteredDrugs = drugs.filter(drug => 
    drug.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/admin')} className="p-2 hover:bg-gray-200 rounded-full transition">
          <ArrowLeft className="w-6 h-6 text-gray-600" />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Inventory Tracking</h2>
          <p className="text-sm text-gray-500">Monitor drug stock levels and expiration alerts.</p>
        </div>
      </div>

      {/* Search & Stats */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search medical supplies..." 
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex gap-4">
            <div className="bg-red-50 text-red-800 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 border border-red-100">
                <AlertTriangle className="w-4 h-4" />
                Low Stock: {drugs.filter(d => d.stock < 10).length} items
            </div>
            <div className="bg-blue-50 text-blue-800 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 border border-blue-100">
                <Package className="w-4 h-4" />
                Total Items: {drugs.length}
            </div>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock Level</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expiry Date</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
               <tr><td colSpan={4} className="px-6 py-10 text-center text-gray-500">Loading inventory...</td></tr>
            ) : filteredDrugs.length === 0 ? (
               <tr><td colSpan={4} className="px-6 py-10 text-center text-gray-500">No items found.</td></tr>
            ) : (
                filteredDrugs.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50 transition">
                        <td className="px-6 py-4 font-medium text-gray-900">{item.name}</td>
                        <td className="px-6 py-4 text-gray-700">{item.stock} units</td>
                        <td className="px-6 py-4">
                            {item.stock < 10 ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">
                                    <AlertTriangle className="w-3 h-3" /> Low Stock
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                                    <CheckCircle className="w-3 h-3" /> In Stock
                                </span>
                            )}
                        </td>
                        <td className="px-6 py-4 text-gray-500 text-sm">{item.expiry}</td>
                    </tr>
                ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Inventory;