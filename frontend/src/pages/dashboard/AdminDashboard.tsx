import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Calendar, Settings, FileText, Pill, CreditCard, LogOut } from 'lucide-react';
import { motion } from 'framer-motion';

interface DashboardCard {
  icon: React.ReactNode;
  title: string;
  description: string;
  action: string;
}

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUser');
    navigate('/login');
  };

  const dashboardCards: DashboardCard[] = [
    {
      icon: <Users className="w-12 h-12 text-blue-500" />,
      title: 'User Management',
      description: 'Manage doctors, staff, and patient accounts',
      action: 'Manage Users',
    },
    {
      icon: <Calendar className="w-12 h-12 text-green-500" />,
      title: 'Appointments',
      description: 'View and manage all appointments',
      action: 'View Appointments',
    },
    {
      icon: <Settings className="w-12 h-12 text-purple-500" />,
      title: 'System Settings',
      description: 'Configure hospital system settings',
      action: 'Settings',
    },
    {
      icon: <FileText className="w-12 h-12 text-orange-500" />,
      title: 'Reports',
      description: 'Generate and view reports',
      action: 'View Reports',
    },
    {
      icon: <Pill className="w-12 h-12 text-teal-500" />,
      title: 'Pharmacy',
      description: 'Manage pharmacy inventory and orders',
      action: 'Pharmacy Management',
    },
    {
      icon: <CreditCard className="w-12 h-12 text-red-500" />,
      title: 'Billing',
      description: 'Manage billing and payments',
      action: 'Billing System',
    },
  ];

  const stats = [
    { label: 'Total Patients', value: '1,250' },
    { label: 'Active Doctors', value: '45' },
    { label: "Today's Appointments", value: '32' },
    { label: 'Staff Members', value: '125' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white shadow-md"
      >
        <div className="container mx-auto px-6 py-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-800">Admin Dashboard</h1>
            <p className="mt-2 text-gray-600">Manage hospital operations and staff</p>
          </div>
          <div className="flex space-x-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/')}
              className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg transition font-semibold"
            >
              Home
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleLogout}
              className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg transition font-semibold flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </motion.button>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-12">
        {/* Quick Stats Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12"
        >
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 + index * 0.1 }}
              className="bg-white rounded-lg shadow-md p-6 text-center hover:shadow-lg transition-shadow"
            >
              <h3 className="text-3xl font-bold text-teal-500 mb-2">{stat.value}</h3>
              <p className="text-gray-600 font-medium">{stat.label}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Dashboard Cards Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <h2 className="text-2xl font-extrabold text-gray-800 mb-8">System Management</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {dashboardCards.map((card, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.15 }}
                viewport={{ once: true }}
                whileHover={{ scale: 1.05, translateY: -10 }}
                className="bg-white p-8 rounded-lg shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer"
              >
                <div className="mb-6 flex justify-center">{card.icon}</div>
                <h3 className="text-xl font-bold text-gray-800 mb-3 text-center">{card.title}</h3>
                <p className="text-gray-600 text-center mb-6">{card.description}</p>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-full bg-teal-500 hover:bg-teal-600 text-white px-4 py-3 rounded-lg transition font-semibold"
                >
                  {card.action}
                </motion.button>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AdminDashboard;
