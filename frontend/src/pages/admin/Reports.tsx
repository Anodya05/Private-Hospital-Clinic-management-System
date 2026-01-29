import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart2, TrendingUp, Users, DollarSign, ArrowLeft, Award } from 'lucide-react';
import api from '../../api/axiosConfig';

interface DoctorPerformance {
  doctor_name: string;
  total_appointments: number;
}

interface DailyStats {
  revenue_today: number;
  patients_today: number;
  low_stock_alerts: number;
}

const Reports: React.FC = () => {
  const navigate = useNavigate();
  const [performance, setPerformance] = useState<DoctorPerformance[]>([]);
  const [stats, setStats] = useState<DailyStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // FIX: Added <DoctorPerformance[]> and <DailyStats> to api.get
        // This tells TypeScript exactly what data structure to expect
        const [perfRes, statsRes] = await Promise.all([
          api.get<DoctorPerformance[]>('/admin/doctor-performance'),
          api.get<DailyStats>('/admin/stats')
        ]);

        setPerformance(perfRes.data);
        setStats(statsRes.data);
      } catch (error) {
        console.error("Failed to load reports", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/admin')} className="p-2 hover:bg-gray-200 rounded-full transition">
          <ArrowLeft className="w-6 h-6 text-gray-600" />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Hospital Analytics & Reports</h2>
          <p className="text-sm text-gray-500">Daily revenue, patient volume, and performance metrics.</p>
        </div>
      </div>

      {loading ? (
        <div className="p-10 text-center text-gray-500">Generating reports...</div>
      ) : (
        <>
          {/* 1. Daily Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl p-6 text-white shadow-lg">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="text-teal-100 text-sm font-medium">Daily Revenue</p>
                        <h3 className="text-3xl font-bold mt-1">${stats?.revenue_today.toLocaleString()}</h3>
                    </div>
                    <div className="p-2 bg-white/20 rounded-lg"><DollarSign className="w-6 h-6 text-white" /></div>
                </div>
                <div className="mt-4 text-teal-100 text-xs flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" /> +12% from yesterday
                </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="text-gray-500 text-sm font-medium">Patient Volume (Today)</p>
                        <h3 className="text-3xl font-bold text-gray-800 mt-1">{stats?.patients_today}</h3>
                    </div>
                    <div className="p-2 bg-blue-50 rounded-lg"><Users className="w-6 h-6 text-blue-600" /></div>
                </div>
                <p className="mt-4 text-gray-400 text-xs">Total appointments scheduled today</p>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                 <div className="flex justify-between items-start">
                    <div>
                        <p className="text-gray-500 text-sm font-medium">Inventory Alerts</p>
                        <h3 className="text-3xl font-bold text-red-600 mt-1">{stats?.low_stock_alerts}</h3>
                    </div>
                    <div className="p-2 bg-red-50 rounded-lg"><BarChart2 className="w-6 h-6 text-red-600" /></div>
                </div>
                <p className="mt-4 text-gray-400 text-xs">Items requiring immediate re-stock</p>
            </div>
          </div>

          {/* 2. Doctor Performance Section */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-2 mb-6">
                <Award className="w-6 h-6 text-orange-500" />
                <h3 className="text-lg font-bold text-gray-800">Top Performing Doctors</h3>
            </div>
            
            <div className="space-y-6">
                {performance.map((doc, index) => (
                    <div key={index} className="space-y-2">
                        <div className="flex justify-between text-sm font-medium">
                            <span className="text-gray-700">{index + 1}. {doc.doctor_name}</span>
                            <span className="text-gray-900">{doc.total_appointments} Patients</span>
                        </div>
                        {/* Visual Progress Bar */}
                        <div className="w-full bg-gray-100 rounded-full h-2.5">
                            <div 
                                className="bg-teal-600 h-2.5 rounded-full transition-all duration-1000" 
                                style={{ width: `${(doc.total_appointments / (performance[0]?.total_appointments || 1)) * 100}%` }}
                            ></div>
                        </div>
                    </div>
                ))}
                {performance.length === 0 && <p className="text-gray-500 text-center">No performance data available yet.</p>}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Reports;