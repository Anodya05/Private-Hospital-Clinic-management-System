import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus, Search, ArrowLeft, Ban, CheckCircle, Edit } from 'lucide-react';
import api from '../../api/axiosConfig';

// Define the shape that MATCHES your AdminController backend
interface User {
  id: number;
  name: string;      // Backend sends 'name', NOT 'first_name'
  email: string;
  role: string;      // Backend sends string (e.g., 'doctor')
  is_active: boolean;
}

const UsersList: React.FC = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // --- Fetch Users ---
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get<User[]>('/admin/users');
      setUsers(response.data);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // --- Toggle Active Status ---
  const toggleStatus = async (user: User) => {
    const action = user.is_active ? "deactivate" : "activate";
    if (!window.confirm(`Are you sure you want to ${action} ${user.name}?`)) return;

    try {
      await api.patch(`/admin/users/${user.id}/toggle-status`);
      fetchUsers(); // Refresh list to show new status
    } catch (error) {
      alert("Failed to update status.");
    }
  };

  // --- Filter Logic ---
  const filteredUsers = users.filter(user => 
    (user.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (user.email?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (user.role?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  // --- Helper for Badge Colors ---
  const getRoleBadge = (role: string) => {
    // Safety check if role is missing
    const safeRole = role ? role.toLowerCase() : 'patient';
    
    switch (safeRole) {
        case 'admin': return 'bg-purple-100 text-purple-800 border-purple-200';
        case 'doctor': return 'bg-green-100 text-green-800 border-green-200';
        case 'pharmacist': return 'bg-orange-100 text-orange-800 border-orange-200';
        case 'receptionist': return 'bg-pink-100 text-pink-800 border-pink-200';
        default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // --- Safe Initial Extraction ---
  const getInitials = (name: string) => {
    return name && name.length > 0 ? name.charAt(0).toUpperCase() : 'U';
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
            <button 
                onClick={() => navigate('/admin')} 
                className="p-2 hover:bg-gray-100 rounded-full transition lg:hidden"
            >
                <ArrowLeft className="w-5 h-5 text-gray-500" />
            </button>
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Staff Management</h1>
                <p className="text-sm text-gray-500">View and manage all hospital users</p>
            </div>
        </div>
        <button
          onClick={() => navigate('/admin/users/new')}
          className="flex items-center gap-2 bg-teal-600 text-white px-5 py-2.5 rounded-lg hover:bg-teal-700 transition shadow-sm font-medium"
        >
          <UserPlus className="w-5 h-5" />
          Add Staff Member
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Search by name, email, or role..."
          className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 transition"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Table Section */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User Details</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {loading ? (
                        <tr><td colSpan={4} className="px-6 py-10 text-center text-gray-500">Loading staff data...</td></tr>
                    ) : filteredUsers.length === 0 ? (
                        <tr><td colSpan={4} className="px-6 py-10 text-center text-gray-500">No users found.</td></tr>
                    ) : (
                        filteredUsers.map((user) => (
                            <tr key={user.id} className="hover:bg-gray-50 transition">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                        <div className="h-10 w-10 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-bold">
                                            {/* SAFE INITIALS CHECK */}
                                            {getInitials(user.name)}
                                        </div>
                                        <div className="ml-4">
                                            <div className="text-sm font-medium text-gray-900">{user.name || 'Unknown Name'}</div>
                                            <div className="text-sm text-gray-500">{user.email}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getRoleBadge(user.role)}`}>
                                        {(user.role || 'Unknown').toUpperCase()}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {user.is_active ? (
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                            <CheckCircle className="w-3 h-3" /> Active
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                            <Ban className="w-3 h-3" /> Inactive
                                        </span>
                                    )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <div className="flex justify-end gap-2">
                                        {/* Edit Button */}
                                        <button 
                                            onClick={() => navigate(`/admin/users/${user.id}/edit`)}
                                            className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                                            title="Edit"
                                        >
                                            <Edit className="w-4 h-4" />
                                        </button>
                                        
                                        {/* Status Toggle */}
                                        <button 
                                            onClick={() => toggleStatus(user)}
                                            className={`px-3 py-1 rounded-md text-xs font-semibold border transition ${
                                                user.is_active 
                                                ? 'text-red-700 border-red-200 hover:bg-red-50' 
                                                : 'text-green-700 border-green-200 hover:bg-green-50'
                                            }`}
                                        >
                                            {user.is_active ? 'Deactivate' : 'Activate'}
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
};

export default UsersList;