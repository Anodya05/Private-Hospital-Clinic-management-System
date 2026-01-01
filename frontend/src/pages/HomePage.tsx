import React from 'react';
import { Link } from 'react-router-dom';

const HomePage: React.FC = () => {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6">
      <h1 className="text-4xl font-bold mb-4">Welcome to the Clinic Portal</h1>
      <p className="mb-6 text-center max-w-xl">Access appointments, prescriptions, and your medical records.</p>
      <div className="space-x-4">
        <Link to="/login" className="px-4 py-2 bg-teal-600 text-white rounded">Login</Link>
        <Link to="/register" className="px-4 py-2 border border-teal-600 text-teal-600 rounded">Register</Link>
      </div>
    </main>
  );
};

export default HomePage;
