import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Plus, Monitor, Server, Laptop, HardDrive, Search, Filter } from 'lucide-react';
import { format } from 'date-fns';
import ComputerImport from './ComputerImport';

interface ComputerAsset {
  id: string;
  asset_tag: string;
  name: string;
  type: 'desktop' | 'laptop' | 'workstation' | 'server';
  manufacturer: string;
  model: string;
  status: 'active' | 'maintenance' | 'retired' | 'storage';
  assigned_to: { full_name: string } | null;
  department: string;
  location: string;
}

interface Category {
  id: string;
  name: string;
}

interface User {
  id: string;
  full_name: string;
  email: string;
  department: string;
}

export default function ComputerInventory() {
  const navigate = useNavigate();
  const [computers, setComputers] = useState<ComputerAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  
  // Filter states
  const [filters, setFilters] = useState({
    status: '',
    type: '',
    department: '',
    assignedTo: '',
    searchQuery: ''
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    loadComputers();
  }, [filters]);

  async function loadInitialData() {
    try {
      // Load users for the assigned to filter
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, full_name, email, department')
        .order('full_name');

      if (usersError) throw usersError;
      setUsers(usersData || []);

    } catch (err) {
      console.error('Error loading initial data:', err);
      setError('Failed to load filter options');
    }
  }

  async function loadComputers() {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('computer_assets')
        .select(`
          *,
          assigned_to (
            full_name,
            email
          )
        `);

      // Apply filters
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.type) {
        query = query.eq('type', filters.type);
      }
      if (filters.department) {
        query = query.eq('department', filters.department);
      }
      if (filters.assignedTo === 'unassigned') {
        query = query.is('assigned_to', null);
      } else if (filters.assignedTo) {
        query = query.eq('assigned_to', filters.assignedTo);
      }

      // Always order by name
      query = query.order('name');

      const { data, error } = await query;

      if (error) throw error;

      // Apply search filter client-side
      let filteredData = data || [];
      if (filters.searchQuery) {
        const search = filters.searchQuery.toLowerCase();
        filteredData = filteredData.filter(computer => 
          computer.name.toLowerCase().includes(search) ||
          computer.asset_tag.toLowerCase().includes(search) ||
          computer.manufacturer.toLowerCase().includes(search) ||
          computer.model.toLowerCase().includes(search) ||
          (computer.assigned_to?.full_name.toLowerCase().includes(search))
        );
      }

      setComputers(filteredData);
    } catch (err) {
      console.error('Error loading computers:', err);
      setError('Failed to load computers. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const resetFilters = () => {
    setFilters({
      status: '',
      type: '',
      department: '',
      assignedTo: '',
      searchQuery: ''
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'maintenance': return 'bg-yellow-100 text-yellow-800';
      case 'retired': return 'bg-red-100 text-red-800';
      case 'storage': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'desktop': return <Monitor className="w-5 h-5" />;
      case 'laptop': return <Laptop className="w-5 h-5" />;
      case 'workstation': return <HardDrive className="w-5 h-5" />;
      case 'server': return <Server className="w-5 h-5" />;
      default: return <Monitor className="w-5 h-5" />;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Computer Inventory</h1>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <Filter className="w-4 h-4 mr-2" />
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </button>
          <Link
            to="/inventory/new"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Computer
          </Link>
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">{error}</h3>
            </div>
          </div>
        </div>
      )}

      <ComputerImport />

      <div className="bg-white shadow-sm rounded-lg">
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={filters.searchQuery}
                  onChange={(e) => setFilters({ ...filters, searchQuery: e.target.value })}
                  placeholder="Search computers..."
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
            </div>
            <div className="flex gap-4">
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="maintenance">Maintenance</option>
                <option value="retired">Retired</option>
                <option value="storage">Storage</option>
              </select>
              <select
                value={filters.type}
                onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              >
                <option value="">All Types</option>
                <option value="desktop">Desktop</option>
                <option value="laptop">Laptop</option>
                <option value="workstation">Workstation</option>
                <option value="server">Server</option>
              </select>
              <select
                value={filters.assignedTo}
                onChange={(e) => setFilters({ ...filters, assignedTo: e.target.value })}
                className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              >
                <option value="">All Assignments</option>
                <option value="unassigned">Unassigned</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.full_name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {showFilters && (
            <div className="mt-4 flex items-center justify-end">
              <button
                onClick={resetFilters}
                className="text-sm font-medium text-gray-700 hover:text-gray-900"
              >
                Reset Filters
              </button>
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Asset
                </th>
                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Assigned To
                </th>
                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Department
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {computers.map((computer) => (
                <tr
                  key={computer.id}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => navigate(`/inventory/${computer.id}`)}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        {getTypeIcon(computer.type)}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {computer.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {computer.asset_tag}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {computer.manufacturer} {computer.model}
                    </div>
                    <div className="text-sm text-gray-500">
                      {computer.type}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(computer.status)}`}>
                      {computer.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {computer.assigned_to?.full_name || 'Unassigned'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {computer.location || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {computer.department || '-'}
                  </td>
                </tr>
              ))}
              {computers.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                    No computers found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}