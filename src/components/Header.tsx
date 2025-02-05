import React from 'react';
import { Bell } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function Header() {
  const { user } = useAuth();

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="px-6 py-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-800">Welcome back</h2>
          <p className="text-sm text-gray-600">{user?.email}</p>
        </div>
        <div className="flex items-center space-x-4">
          <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-full relative">
            <Bell size={20} />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>
        </div>
      </div>
    </header>
  );
}