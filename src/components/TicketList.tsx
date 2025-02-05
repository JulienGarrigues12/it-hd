import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, AlertCircle, Clock, CheckCircle, Filter, Search } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { format } from 'date-fns';

interface Ticket {
  id: string;
  title: string;
  type: string;
  priority: string;
  status: string;
  created_at: string;
  category: { name: string };
  requestor: { full_name: string };
  assignee: { full_name: string } | null;
}

interface Category {
  id: string;
  name: string;
}

interface User {
  id: string;
  full_name: string;
  email: string;
}

export default function TicketList() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  
  // Filter states
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    category: '',
    requestor: '',
    assignee: '',
    dateRange: '30', // days
    searchQuery: ''
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    loadTickets();
  }, [filters]);

  async function loadInitialData() {
    try {
      // Load categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('ticket_categories')
        .select('id, name')
        .eq('is_active', true)
        .order('name');

      if (categoriesError) throw categoriesError;
      setCategories(categoriesData || []);

      // Load users
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, full_name, email')
        .order('full_name');

      if (usersError) throw usersError;
      setUsers(usersData || []);

    } catch (err) {
      console.error('Error loading initial data:', err);
      setError('Failed to load filter options');
    }
  }

  async function loadTickets() {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('tickets')
        .select(`
          *,
          category:ticket_categories(name),
          requestor:requestor_id(full_name),
          assignee:assigned_to(full_name)
        `);

      // Apply filters
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.priority) {
        query = query.eq('priority', filters.priority);
      }
      if (filters.category) {
        query = query.eq('category_id', filters.category);
      }
      if (filters.requestor) {
        query = query.eq('requestor_id', filters.requestor);
      }
      if (filters.assignee) {
        query = query.eq('assigned_to', filters.assignee);
      }
      if (filters.dateRange) {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(filters.dateRange));
        query = query.gte('created_at', startDate.toISOString());
      }

      // Always order by priority (high to low) and creation date
      query = query
        .order('priority', { ascending: false })
        .order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) throw error;

      // Apply search filter client-side
      let filteredData = data || [];
      if (filters.searchQuery) {
        const search = filters.searchQuery.toLowerCase();
        filteredData = filteredData.filter(ticket => 
          ticket.title.toLowerCase().includes(search) ||
          ticket.requestor.full_name.toLowerCase().includes(search) ||
          (ticket.assignee?.full_name.toLowerCase().includes(search))
        );
      }

      setTickets(filteredData);
    } catch (err) {
      console.error('Error loading tickets:', err);
      setError('Failed to load tickets. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const resetFilters = () => {
    setFilters({
      status: '',
      priority: '',
      category: '',
      requestor: '',
      assignee: '',
      dateRange: '30',
      searchQuery: ''
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open': return <AlertCircle className="w-5 h-5 text-blue-500" />;
      case 'in_progress': return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'resolved': return <CheckCircle className="w-5 h-5 text-green-500" />;
      default: return null;
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
        <h1 className="text-2xl font-semibold text-gray-900">Tickets</h1>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <Filter className="w-4 h-4 mr-2" />
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </button>
          <Link
            to="/tickets/new"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Ticket
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

      {showFilters && (
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                Status
              </label>
              <select
                id="status"
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                <option value="">All Status</option>
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
            </div>

            <div>
              <label htmlFor="priority" className="block text-sm font-medium text-gray-700">
                Priority
              </label>
              <select
                id="priority"
                value={filters.priority}
                onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                <option value="">All Priorities</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                Category
              </label>
              <select
                id="category"
                value={filters.category}
                onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                <option value="">All Categories</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="requestor" className="block text-sm font-medium text-gray-700">
                Requestor
              </label>
              <select
                id="requestor"
                value={filters.requestor}
                onChange={(e) => setFilters({ ...filters, requestor: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                <option value="">All Requestors</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.full_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="assignee" className="block text-sm font-medium text-gray-700">
                Assignee
              </label>
              <select
                id="assignee"
                value={filters.assignee}
                onChange={(e) => setFilters({ ...filters, assignee: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                <option value="">All Assignees</option>
                <option value="unassigned">Unassigned</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.full_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="dateRange" className="block text-sm font-medium text-gray-700">
                Created Within
              </label>
              <select
                id="dateRange"
                value={filters.dateRange}
                onChange={(e) => setFilters({ ...filters, dateRange: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                <option value="7">Last 7 Days</option>
                <option value="30">Last 30 Days</option>
                <option value="90">Last 90 Days</option>
                <option value="365">Last Year</option>
                <option value="">All Time</option>
              </select>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <div className="relative flex-1 max-w-lg">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={filters.searchQuery}
                onChange={(e) => setFilters({ ...filters, searchQuery: e.target.value })}
                placeholder="Search tickets..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
            <button
              onClick={resetFilters}
              className="ml-4 px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
            >
              Reset Filters
            </button>
          </div>
        </div>
      )}

      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        {tickets.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Title
                  </th>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Priority
                  </th>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Requestor
                  </th>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Assignee
                  </th>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {tickets.map((ticket) => (
                  <tr key={ticket.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getStatusIcon(ticket.status)}
                        <span className="ml-2 text-sm text-gray-900">
                          {ticket.status.replace('_', ' ')}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link
                        to={`/tickets/${ticket.id}`}
                        className="text-sm font-medium text-blue-600 hover:text-blue-900"
                      >
                        {ticket.title}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
                        {ticket.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {ticket.category?.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {ticket.requestor?.full_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {ticket.assignee?.full_name || 'Unassigned'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {format(new Date(ticket.created_at), 'MMM d, yyyy')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-6 text-center text-gray-500">
            No tickets found. Create a new ticket to get started.
          </div>
        )}
      </div>
    </div>
  );
}