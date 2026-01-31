import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, ArrowLeft, User, Mail, Lock, Building, Stethoscope } from 'lucide-react';
import api from '../../api/axiosConfig'; // This uses your new config file

const CreateUser: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'patient', // Default role
    department_id: '', // Only for doctors
  });

  // Hardcoded departments (In the future, you can fetch these from the DB)
  const departments = [
    { id: 1, name: 'OPD' },
    { id: 2, name: 'General Medicine' },
    { id: 3, name: 'Neurology' },
    { id: 4, name: 'Cardiology' },
    { id: 5, name: 'Pediatrics' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    // Create the payload to send to the backend
    const payload: any = {
      name: formData.name,
      email: formData.email,
      password: formData.password,
      role: formData.role,
    };

    // Only add department_id if the role is 'doctor'
    if (formData.role === 'doctor') {
      if (!formData.department_id) {
        setError("Please select a department for the doctor.");
        setLoading(false);
        return;
      }
      payload.department_id = formData.department_id;
    }

    try {
      // Send POST request to create user
      await api.post('/admin/users', payload);
      
      // On success, redirect back to the list
      navigate('/admin/users');
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to create user. Please check your inputs.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button 
            onClick={() => navigate('/admin/users')} 
            className="p-2 hover:bg-gray-200 rounded-full transition"
        >
            <ArrowLeft className="w-6 h-6 text-gray-600" />
        </button>
        <div>
            <h2 className="text-2xl font-bold text-gray-900">Add New User</h2>
            <p className="text-sm text-gray-500">Create account for doctor, staff, or patient.</p>
        </div>
      </div>

      {/* Form Card */}
      <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
        {error && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700">
                <p className="font-medium">Error</p>
                <p className="text-sm">{error}</p>
            </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name & Email Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input 
                  type="text" 
                  required 
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none transition"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input 
                  type="email" 
                  required 
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none transition"
                  placeholder="john@hospital.com"
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                />
              </div>
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input 
                type="password" 
                required 
                minLength={8}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none transition"
                placeholder="Minimum 8 characters"
                value={formData.password}
                onChange={e => setFormData({...formData, password: e.target.value})}
              />
            </div>
          </div>

          {/* Role Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Assign Role</label>
              <div className="relative">
                <Stethoscope className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <select 
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none bg-white transition"
                  value={formData.role}
                  onChange={e => setFormData({...formData, role: e.target.value})}
                >
                  <option value="patient">Patient</option>
                  <option value="doctor">Doctor</option>
                  <option value="pharmacist">Pharmacist (Staff)</option>
                  <option value="receptionist">Receptionist (Staff)</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>

            {/* Conditional Department Dropdown (Only for Doctors) */}
            {formData.role === 'doctor' && (
              <div className="animate-fade-in">
                <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                <div className="relative">
                    <Building className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <select 
                    required
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none bg-white transition"
                    value={formData.department_id}
                    onChange={e => setFormData({...formData, department_id: e.target.value})}
                    >
                    <option value="">Select Department</option>
                    {departments.map(d => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                    </select>
                </div>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="pt-6 border-t border-gray-100">
            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-teal-600 text-white font-semibold py-3 rounded-lg hover:bg-teal-700 transition flex justify-center items-center gap-2 shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
            >
              <Save className="w-5 h-5" />
              {loading ? 'Creating Account...' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateUser;