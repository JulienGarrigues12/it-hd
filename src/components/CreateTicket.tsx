import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface TicketForm {
  title: string;
  description: string;
  type: 'incident' | 'request';
  priority: 'critical' | 'high' | 'medium' | 'low';
  category_id: string;
  requestor_id?: string;
}

interface Category {
  id: string;
  name: string;
}

interface User {
  id: string;
  email: string;
  full_name: string;
}

export default function CreateTicket() {
  const { register, handleSubmit, formState: { errors }, setValue } = useForm<TicketForm>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [currentUserRole, setCurrentUserRole] = useState<string>('user');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

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

      // Get current user's role
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('role')
        .eq('id', user?.id)
        .single();

      if (userError) throw userError;
      setCurrentUserRole(userData?.role || 'user');

      // Load users list if current user is admin or technician
      if (userData?.role === 'admin' || userData?.role === 'technician') {
        const { data: usersData, error: usersError } = await supabase
          .from('users')
          .select('id, email, full_name')
          .order('full_name');

        if (usersError) throw usersError;
        setUsers(usersData || []);
      }
    } catch (error) {
      console.error('Error loading initial data:', error);
      setError('Failed to load initial data. Please try again.');
    }
  }

  const onSubmit = async (data: TicketForm) => {
    if (!user) {
      setError('You must be logged in to create a ticket');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const ticketData = {
        title: data.title,
        description: data.description,
        type: data.type,
        priority: data.priority,
        category_id: data.category_id,
        created_by: user.id,
        status: 'open',
        requestor_id: data.requestor_id || user.id // Use selected requestor or current user
      };

      const { error } = await supabase
        .from('tickets')
        .insert([ticketData]);

      if (error) throw error;

      navigate('/tickets');
    } catch (error) {
      console.error('Error creating ticket:', error);
      setError('Failed to create ticket. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Create New Ticket</h1>
      
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 bg-white shadow-sm rounded-lg p-6">
        {/* Show requestor field only for admin and technician */}
        {(currentUserRole === 'admin' || currentUserRole === 'technician') && (
          <div>
            <label htmlFor="requestor_id" className="block text-sm font-medium text-gray-700">
              Requestor
            </label>
            <select
              {...register('requestor_id')}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              <option value="">Select requestor</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.full_name} ({user.email})
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700">
            Title
          </label>
          <input
            {...register('title', { required: 'Title is required' })}
            type="text"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
          {errors.title && (
            <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">
            Description
          </label>
          <textarea
            {...register('description', { required: 'Description is required' })}
            rows={4}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
          {errors.description && (
            <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-700">
              Type
            </label>
            <select
              {...register('type', { required: 'Type is required' })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              <option value="">Select type</option>
              <option value="incident">Incident</option>
              <option value="request">Request</option>
            </select>
            {errors.type && (
              <p className="mt-1 text-sm text-red-600">{errors.type.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="priority" className="block text-sm font-medium text-gray-700">
              Priority
            </label>
            <select
              {...register('priority', { required: 'Priority is required' })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              <option value="">Select priority</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
            {errors.priority && (
              <p className="mt-1 text-sm text-red-600">{errors.priority.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="category_id" className="block text-sm font-medium text-gray-700">
              Category
            </label>
            <select
              {...register('category_id', { required: 'Category is required' })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              <option value="">Select category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            {errors.category_id && (
              <p className="mt-1 text-sm text-red-600">{errors.category_id.message}</p>
            )}
          </div>
        </div>

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => navigate('/tickets')}
            disabled={loading}
            className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 flex items-center"
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creating...
              </>
            ) : (
              'Create Ticket'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}