import React, { useEffect, useState } from 'react';
import { Trash2, Search } from 'lucide-react';
import api from '../../api/axiosConfig';

interface Appointment {
  id: number;
  patient_name: string;
  doctor_name: string;
  department: string;
  date: string;
  status: string;
  reason: string;
}

const Appointments: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchAppointments = async () => {
    try {
      const res = await api.get<Appointment[]>('/admin/appointments');
      setAppointments(res.data);
    } catch (error) {
      console.error("Error fetching appointments", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const handleDelete = async (id: number) => {
    if(!window.confirm("Are you sure you want to cancel this appointment?")) return;
    try {
      await api.delete(`/admin/appointments/${id}`);
      setAppointments(prev => prev.filter(a => a.id !== id));
    } catch (error) {
      alert("Failed to delete appointment");
    }
  };

  const filteredAppointments = appointments.filter(appt => 
    appt.patient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    appt.doctor_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Appointments</h2>
        <div className="relative w-64">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search..." 
            className="w-full pl-10 pr-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-teal-500"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Patient</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Doctor</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">Loading...</td></tr>
            ) : filteredAppointments.map((appt) => (
              <tr key={appt.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-medium">{appt.patient_name}</td>
                <td className="px-6 py-4">{appt.doctor_name}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{new Date(appt.date).toLocaleString()}</td>
                <td className="px-6 py-4"><span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">{appt.status}</span></td>
                <td className="px-6 py-4 text-right">
                  <button onClick={() => handleDelete(appt.id)} className="text-red-600 hover:bg-red-50 p-2 rounded-full">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Appointments;