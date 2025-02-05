import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Ticket, Settings, LogOut, UserCircle, Monitor, BarChart } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function Sidebar() {
  const { signOut } = useAuth();

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-800">Help Desk</h1>
      </div>
      <nav className="flex-1 px-4 space-y-2">
        <NavLink
          to="/"
          className={({ isActive }) =>
            `flex items-center space-x-3 px-4 py-2 rounded-lg ${
              isActive ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-50'
            }`
          }
        >
          <LayoutDashboard size={20} />
          <span>Dashboard</span>
        </NavLink>
        <NavLink
          to="/tickets"
          className={({ isActive }) =>
            `flex items-center space-x-3 px-4 py-2 rounded-lg ${
              isActive ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-50'
            }`
          }
        >
          <Ticket size={20} />
          <span>Tickets</span>
        </NavLink>
        <NavLink
          to="/inventory"
          className={({ isActive }) =>
            `flex items-center space-x-3 px-4 py-2 rounded-lg ${
              isActive ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-50'
            }`
          }
        >
          <Monitor size={20} />
          <span>Inventory</span>
        </NavLink>
        <NavLink
          to="/statistics"
          className={({ isActive }) =>
            `flex items-center space-x-3 px-4 py-2 rounded-lg ${
              isActive ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-50'
            }`
          }
        >
          <BarChart size={20} />
          <span>Statistics</span>
        </NavLink>
        <NavLink
          to="/admin"
          className={({ isActive }) =>
            `flex items-center space-x-3 px-4 py-2 rounded-lg ${
              isActive ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-50'
            }`
          }
        >
          <Settings size={20} />
          <span>Admin</span>
        </NavLink>
        <NavLink
          to="/profile"
          className={({ isActive }) =>
            `flex items-center space-x-3 px-4 py-2 rounded-lg ${
              isActive ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-50'
            }`
          }
        >
          <UserCircle size={20} />
          <span>Profile</span>
        </NavLink>
      </nav>
      <div className="p-4 border-t">
        <button
          onClick={() => signOut()}
          className="flex items-center space-x-3 px-4 py-2 w-full text-gray-700 hover:bg-gray-50 rounded-lg"
        >
          <LogOut size={20} />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
}