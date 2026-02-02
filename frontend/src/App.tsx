import React, { useState } from 'react';
import { 
  CreditCard, DollarSign, FileText, AlertCircle, 
  Search, Download, Plus, Settings 
} from 'lucide-react';

// --- Types ---
interface Invoice {
  id: string;
  patient_name: string;
  date: string;
  amount: number;
  status: 'Paid' | 'Pending' | 'Cancelled';
  payment_method: 'Cash' | 'Card' | 'Insurance';
}

interface ServicePrice {
  id: number;
  name: string;
  code: string;
  price: number;
}

const Billing: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'invoices' | 'pricing'>('invoices');
  const [searchTerm, setSearchTerm] = useState('');

  // Mock Data (Replace with API calls later)
  const invoices: Invoice[] = [
    { id: 'INV-2026-001', patient_name: 'John Doe', date: '2026-02-01', amount: 150.00, status: 'Paid', payment_method: 'Card' },
    { id: 'INV-2026-002', patient_name: 'Sarah Smith', date: '2026-02-01', amount: 45.00, status: 'Pending', payment_method: 'Cash' },
    { id: 'INV-2026-003', patient_name: 'Michael Brown', date: '2026-01-31', amount: 200.00, status: 'Cancelled', payment_method: 'Insurance' },
  ];

  const services: ServicePrice[] = [
    { id: 1, name: 'General Consultation', code: 'CON-001', price: 50.00 },
    { id: 2, name: 'Blood Test (CBC)', code: 'LAB-001', price: 25.00 },
    { id: 3, name: 'X-Ray (Chest)', code: 'RAD-001', price: 80.00 },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Paid': return 'bg-green-100 text-green-800';
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      case 'Cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto animate-fade-in">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Billing & Finance</h1>
          <p className="text-gray-500 mt-1">Manage invoices, payments, and service pricing.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setActiveTab('invoices')}
            className={`px-4 py-2 rounded-lg font-medium transition ${activeTab === 'invoices' ? 'bg-teal-600 text-white shadow-md' : 'bg-white text-gray-600 border'}`}
          >
            Invoices
          </button>
          <button 
            onClick={() => setActiveTab('pricing')}
            className={`px-4 py-2 rounded-lg font-medium transition ${activeTab === 'pricing' ? 'bg-teal-600 text-white shadow-md' : 'bg-white text-gray-600 border'}`}
          >
            Price List
          </button>
        </div>
      </div>

      {activeTab === 'invoices' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Revenue (Today)</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">$1,250.00</h3>
            </div>
            <div className="p-3 bg-green-50 text-green-600 rounded-lg"><DollarSign size={24} /></div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Pending Payments</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">$340.00</h3>
            </div>
            <div className="p-3 bg-yellow-50 text-yellow-600 rounded-lg"><AlertCircle size={24} /></div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Invoices Generated</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">128</h3>
            </div>
            <div className="p-3 bg-blue-50 text-blue-600 rounded-lg"><FileText size={24} /></div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {activeTab === 'invoices' && (
          <div>
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <div className="relative w-64">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Search invoice or patient..." 
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <button className="flex items-center gap-2 bg-white border border-gray-300 px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
                <Download size={16} /> Export Report
              </button>
            </div>

            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 font-semibold text-gray-700">Invoice ID</th>
                  <th className="px-6 py-3 font-semibold text-gray-700">Patient</th>
                  <th className="px-6 py-3 font-semibold text-gray-700">Date</th>
                  <th className="px-6 py-3 font-semibold text-gray-700">Amount</th>
                  <th className="px-6 py-3 font-semibold text-gray-700">Method</th>
                  <th className="px-6 py-3 font-semibold text-gray-700">Status</th>
                  <th className="px-6 py-3 font-semibold text-gray-700 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 font-medium text-gray-900">{inv.id}</td>
                    <td className="px-6 py-4 text-gray-600">{inv.patient_name}</td>
                    <td className="px-6 py-4 text-gray-500">{inv.date}</td>
                    <td className="px-6 py-4 font-medium text-gray-900">${inv.amount.toFixed(2)}</td>
                    <td className="px-6 py-4 text-gray-500">{inv.payment_method}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(inv.status)}`}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-teal-600 hover:text-teal-800 font-medium text-xs">View</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'pricing' && (
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-lg font-bold text-gray-800">Service Price List</h3>
                <p className="text-sm text-gray-500">Set the standard rates for clinic services.</p>
              </div>
              <button className="flex items-center gap-2 bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition shadow-sm">
                <Plus size={18} /> Add New Service
              </button>
            </div>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 font-semibold text-gray-700">Code</th>
                    <th className="px-6 py-3 font-semibold text-gray-700">Service Name</th>
                    <th className="px-6 py-3 font-semibold text-gray-700 text-right">Standard Price</th>
                    <th className="px-6 py-3 font-semibold text-gray-700 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {services.map((svc) => (
                    <tr key={svc.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-mono text-gray-500 text-xs">{svc.code}</td>
                      <td className="px-6 py-4 font-medium text-gray-900">{svc.name}</td>
                      <td className="px-6 py-4 text-right text-gray-900">${svc.price.toFixed(2)}</td>
                      <td className="px-6 py-4 text-right">
                        <button className="p-1 hover:bg-gray-100 rounded text-gray-500 hover:text-teal-600">
                          <Settings size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Billing;