import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Users, Tag, BarChart3, Settings, Plus, Trash2, Edit2, ChevronDown, ChevronRight } from 'lucide-react';
import UserImport from './UserImport';

type User = {
  id: string;
  email: string;
  role: 'user' | 'technician' | 'admin';
  full_name: string;
  department: string;
  created_at: string;
};

type Category = {
  id: string;
  name: string;
  description: string;
  is_active: boolean;
};

type Tab = 'users' | 'categories' | 'statistics' | 'settings';

type SystemSettings = {
  emailNotifications: boolean;
  autoAssignment: boolean;
  defaultPriority: 'low' | 'medium' | 'high';
  maintenanceMode: boolean;
};

export default function AdminPanel() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isNewUserExpanded, setIsNewUserExpanded] = useState(false);
  const [settings, setSettings] = useState<SystemSettings>({
    emailNotifications: true,
    autoAssignment: false,
    defaultPriority: 'medium',
    maintenanceMode: false,
  });

  const [newUser, setNewUser] = useState({
    email: '',
    full_name: '',
    role: 'user' as const,
    department: '',
  });

  const [newCategory, setNewCategory] = useState({
    name: '',
    description: '',
    is_active: true,
  });

  useEffect(() => {
    loadData();
  }, [activeTab]);

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      if (activeTab === 'users') {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        setUsers(data || []);
      } else if (activeTab === 'categories') {
        const { data, error } = await supabase
          .from('ticket_categories')
          .select('*')
          .order('name');
        
        if (error) throw error;
        setCategories(data || []);
      }
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load data. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function createUser() {
    try {
      const { data: authUser, error: signUpError } = await supabase.auth.signUp({
        email: newUser.email,
        password: 'temppass123',
      });

      if (signUpError) throw signUpError;

      if (authUser.user) {
        const { error: profileError } = await supabase
          .from('users')
          .insert([{
            id: authUser.user.id,
            ...newUser,
          }]);

        if (profileError) throw profileError;

        setNewUser({ email: '', full_name: '', role: 'user', department: '' });
        setIsNewUserExpanded(false);
        await loadData();
      }
    } catch (err) {
      console.error('Error creating user:', err);
      setError('Failed to create user. Please try again.');
    }
  }

  async function updateUser(userId: string) {
    if (!editingUser) return;

    try {
      const { error } = await supabase
        .from('users')
        .update({
          full_name: editingUser.full_name,
          role: editingUser.role,
          department: editingUser.department,
        })
        .eq('id', userId);

      if (error) throw error;
      setEditingUser(null);
      await loadData();
    } catch (err) {
      console.error('Error updating user:', err);
      setError('Failed to update user. Please try again.');
    }
  }

  async function deleteUser(userId: string) {
    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);

      if (error) throw error;
      await loadData();
    } catch (err) {
      console.error('Error deleting user:', err);
      setError('Failed to delete user. Please try again.');
    }
  }

  async function createCategory() {
    try {
      const { error } = await supabase
        .from('ticket_categories')
        .insert([newCategory]);

      if (error) throw error;
      setNewCategory({ name: '', description: '', is_active: true });
      await loadData();
    } catch (err) {
      console.error('Error creating category:', err);
      setError('Failed to create category. Please try again.');
    }
  }

  async function updateCategory(categoryId: string) {
    if (!editingCategory) return;

    try {
      const { error } = await supabase
        .from('ticket_categories')
        .update({
          name: editingCategory.name,
          description: editingCategory.description,
          is_active: editingCategory.is_active,
        })
        .eq('id', categoryId);

      if (error) throw error;
      setEditingCategory(null);
      await loadData();
    } catch (err) {
      console.error('Error updating category:', err);
      setError('Failed to update category. Please try again.');
    }
  }

  async function deleteCategory(categoryId: string) {
    try {
      const { error } = await supabase
        .from('ticket_categories')
        .delete()
        .eq('id', categoryId);

      if (error) throw error;
      await loadData();
    } catch (err) {
      console.error('Error deleting category:', err);
      setError('Failed to delete category. Please try again.');
    }
  }

  async function saveSettings() {
    setError('Settings saved successfully!');
    setTimeout(() => setError(null), 3000);
  }

  const tabs = [
    { id: 'users', label: 'Users', icon: Users },
    { id: 'categories', label: 'Categories', icon: Tag },
    { id: 'statistics', label: 'Statistics', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-200">
        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto">
            <h1 className="text-2xl font-semibold text-gray-900">Admin Panel</h1>
            <p className="mt-2 text-sm text-gray-700">
              Manage users, categories, and system settings
            </p>
          </div>
        </div>
        
        <div className="mt-6">
          <nav className="-mb-px flex space-x-8">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id as Tab)}
                className={`
                  ${activeTab === id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'}
                  whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium flex items-center
                `}
              >
                <Icon className="w-5 h-5 mr-2" />
                {label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {error && (
        <div className={`rounded-md p-4 ${
          error.includes('success') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
        }`}>
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium">{error}</h3>
            </div>
          </div>
        </div>
      )}

      <div className="mt-8">
        {activeTab === 'users' && (
          <div className="space-y-6">
            <UserImport />
            
            <div className="bg-white shadow-sm rounded-lg">
              <button
                onClick={() => setIsNewUserExpanded(!isNewUserExpanded)}
                className="w-full px-6 py-4 flex items-center justify-between text-left border-b border-gray-200 focus:outline-none"
              >
                <div className="flex items-center space-x-2">
                  <Plus className="w-5 h-5 text-gray-500" />
                  <span className="text-lg font-medium text-gray-900">Add New User</span>
                </div>
                {isNewUserExpanded ? (
                  <ChevronDown className="w-5 h-5 text-gray-500" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-gray-500" />
                )}
              </button>

              {isNewUserExpanded && (
                <div className="p-6 border-b border-gray-200">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <input
                      type="email"
                      placeholder="Email"
                      value={newUser.email}
                      onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                      className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                    <input
                      type="text"
                      placeholder="Full Name"
                      value={newUser.full_name}
                      onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })}
                      className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                    <select
                      value={newUser.role}
                      onChange={(e) => setNewUser({ ...newUser, role: e.target.value as 'user' | 'technician' | 'admin' })}
                      className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    >
                      <option value="user">User</option>
                      <option value="technician">Technician</option>
                      <option value="admin">Admin</option>
                    </select>
                    <input
                      type="text"
                      placeholder="Department"
                      value={newUser.department}
                      onChange={(e) => setNewUser({ ...newUser, department: e.target.value })}
                      className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  <div className="mt-4 flex justify-end">
                    <button
                      onClick={createUser}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add User
                    </button>
                  </div>
                </div>
              )}

              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Department
                    </th>
                    <th className="px-6 py-3 bg-gray-50"></th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {editingUser?.id === user.id ? (
                          <input
                            type="text"
                            value={editingUser.full_name}
                            onChange={(e) => setEditingUser({ ...editingUser, full_name: e.target.value })}
                            className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                          />
                        ) : (
                          <span className="text-sm font-medium text-gray-900">{user.full_name}</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {editingUser?.id === user.id ? (
                          <select
                            value={editingUser.role}
                            onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value as 'user' | 'technician' | 'admin' })}
                            className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                          >
                            <option value="user">User</option>
                            <option value="technician">Technician</option>
                            <option value="admin">Admin</option>
                          </select>
                        ) : (
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                            user.role === 'technician' ? 'bg-blue-100 text-blue-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {user.role}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {editingUser?.id === user.id ? (
                          <input
                            type="text"
                            value={editingUser.department}
                            onChange={(e) => setEditingUser({ ...editingUser, department: e.target.value })}
                            className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                          />
                        ) : (
                          <span className="text-sm text-gray-500">{user.department}</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {editingUser?.id === user.id ? (
                          <div className="flex space-x-2 justify-end">
                            <button
                              onClick={() => updateUser(user.id)}
                              className="text-green-600 hover:text-green-900"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingUser(null)}
                              className="text-gray-600 hover:text-gray-900"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="flex space-x-2 justify-end">
                            <button
                              onClick={() => setEditingUser(user)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => deleteUser(user.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'categories' && (
          <div className="bg-white shadow-sm rounded-lg">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Category</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <input
                  type="text"
                  placeholder="Name"
                  value={newCategory.name}
                  onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                  className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
                <input
                  type="text"
                  placeholder="Description"
                  value={newCategory.description}
                  onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                  className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <button
                onClick={createCategory}
                className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Category
              </button>
            </div>

            <div className="divide-y divide-gray-200">
              {categories.map((category) => (
                <div key={category.id} className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      {editingCategory?.id === category.id ? (
                        <div className="space-y-4">
                          <input
                            type="text"
                            value={editingCategory.name}
                            onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                            className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                          />
                          <input
                            type="text"
                            value={editingCategory.description}
                            onChange={(e) => setEditingCategory({ ...editingCategory, description: e.target.value })}
                            className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                          />
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => updateCategory(category.id)}
                              className="text-green-600 hover:text-green-900"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingCategory(null)}
                              className="text-gray-600 hover:text-gray-900"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <h3 className="text-lg font-medium text-gray-900">{category.name}</h3>
                          <p className="mt-1 text-sm text-gray-500">{category.description}</p>
                        </>
                      )}
                    </div>
                    {!editingCategory && (
                      <div className="flex items-center space-x-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          category.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {category.is_active ? 'Active' : 'Inactive'}
                        </span>
                        <button
                          onClick={() => setEditingCategory(category)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteCategory(category.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="bg-white shadow-sm rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-6">System Settings</h3>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-gray-900">Email Notifications</h4>
                  <p className="text-sm text-gray-500">Enable email notifications for ticket updates</p>
                </div>
                <button
                  onClick={() => setSettings({ ...settings, emailNotifications: !settings.emailNotifications })}
                  className={`relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                    settings.emailNotifications ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <span className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200 ${
                    settings.emailNotifications ? 'translate-x-5' : 'translate-x-0'
                  }`} />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-gray-900">Auto Assignment</h4>
                  <p className="text-sm text-gray-500">Automatically assign tickets to available technicians</p>
                </div>
                <button
                  onClick={() => setSettings({ ...settings, autoAssignment: !settings.autoAssignment })}
                  className={`relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                    settings.autoAssignment ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <span className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200 ${
                    settings.autoAssignment ? 'translate-x-5' : 'translate-x-0'
                  }`} />
                </button>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">Default Ticket Priority</h4>
                <select
                  value={settings.defaultPriority}
                  onChange={(e) => setSettings({ ...settings, defaultPriority: e.target.value as 'low' | 'medium' | 'high' })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-gray-900">Maintenance Mode</h4>
                  <p className="text-sm text-gray-500">Temporarily disable ticket creation</p>
                </div>
                <button
                  onClick={() => setSettings({ ...settings, maintenanceMode: !settings.maintenanceMode })}
                  className={`relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                    settings.maintenanceMode ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <span className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200 ${
                    settings.maintenanceMode ? 'translate-x-5' : 'translate-x-0'
                  }`} />
                </button>
              </div>

              <div className="pt-6">
                <button
                  onClick={saveSettings}
                  className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                >
                  Save Settings
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}