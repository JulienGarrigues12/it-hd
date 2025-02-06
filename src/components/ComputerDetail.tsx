import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Clock, AlertCircle, CheckCircle, ArrowLeft, User, Calendar, Tag, MessageSquare, UserPlus, Monitor, Server, Laptop, HardDrive, Package, History, PenTool as Tool } from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';

interface AssignmentHistory {
  id: string;
  user_id: string;
  assigned_by: { full_name: string };
  assigned_at: string;
  unassigned_at: string | null;
  notes: string;
  user: { full_name: string; email: string };
}

interface ComputerAsset {
  id: string;
  asset_tag: string;
  serial_number: string;
  name: string;
  type: 'desktop' | 'laptop' | 'workstation' | 'server';
  manufacturer: string;
  model: string;
  status: 'active' | 'maintenance' | 'retired' | 'storage';
  assigned_to: { full_name: string; email: string } | null;
  assigned_date: string;
  location: string;
  department: string;
  specifications: any;
  notes: string;
}

interface MaintenanceRecord {
  id: string;
  maintenance_type: string;
  description: string;
  performed_by: { full_name: string };
  performed_at: string;
  cost: number;
  next_maintenance_date: string;
  notes: string;
}

interface Software {
  id: string;
  software_name: string;
  version: string;
  license_key: string;
  installation_date: string;
  expiry_date: string;
  status: string;
  notes: string;
}

interface User {
  id: string;
  full_name: string;
  email: string;
  department: string;
}

export default function ComputerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [computer, setComputer] = useState<ComputerAsset | null>(null);
  const [maintenance, setMaintenance] = useState<MaintenanceRecord[]>([]);
  const [software, setSoftware] = useState<Software[]>([]);
  const [assignmentHistory, setAssignmentHistory] = useState<AssignmentHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'details' | 'maintenance' | 'software' | 'history'>('details');
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [assigning, setAssigning] = useState(false);
  const [assignmentNotes, setAssignmentNotes] = useState('');
  const [userRole, setUserRole] = useState<string>('user');
  const [changingStatus, setChangingStatus] = useState(false);

  useEffect(() => {
    if (user) {
      loadUserRole();
      loadComputerData();
    }
  }, [id, user]);

  useEffect(() => {
    if (showAssignModal) {
      loadUsers();
    }
  }, [showAssignModal]);

  async function loadUsers() {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, full_name, email, department')
        .order('full_name');

      if (error) throw error;
      setUsers(data || []);
    } catch (err) {
      console.error('Error loading users:', err);
    }
  }

  async function loadUserRole() {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setUserRole(data.role);
      }
    } catch (err) {
      console.error('Error loading user role:', err);
      setUserRole('user');
    }
  }

  async function loadComputerData() {
    try {
      setLoading(true);
      setError(null);

      const { data: computerData, error: computerError } = await supabase
        .from('computer_assets')
        .select(`
          *,
          assigned_to (
            full_name,
            email
          )
        `)
        .eq('id', id)
        .single();

      if (computerError) throw computerError;
      setComputer(computerData);

      const { data: historyData, error: historyError } = await supabase
        .from('computer_assignment_history')
        .select(`
          *,
          assigned_by (full_name),
          user:user_id (full_name, email)
        `)
        .eq('computer_id', id)
        .order('assigned_at', { ascending: false });

      if (historyError) throw historyError;
      setAssignmentHistory(historyData || []);

      const { data: maintenanceData, error: maintenanceError } = await supabase
        .from('computer_maintenance')
        .select(`
          *,
          performed_by (
            full_name
          )
        `)
        .eq('computer_id', id)
        .order('performed_at', { ascending: false });

      if (maintenanceError) throw maintenanceError;
      setMaintenance(maintenanceData || []);

      const { data: softwareData, error: softwareError } = await supabase
        .from('computer_software')
        .select('*')
        .eq('computer_id', id)
        .order('software_name');

      if (softwareError) throw softwareError;
      setSoftware(softwareData || []);

    } catch (err) {
      console.error('Error loading computer data:', err);
      setError('Failed to load computer data');
    } finally {
      setLoading(false);
    }
  }

  async function assignComputer() {
    if (!selectedUser || !computer || !user) return;

    try {
      setAssigning(true);

      if (computer.assigned_to) {
        const { error: updateError } = await supabase
          .from('computer_assignment_history')
          .update({ unassigned_at: new Date().toISOString() })
          .eq('computer_id', computer.id)
          .is('unassigned_at', null);

        if (updateError) throw updateError;
      }

      const { error: historyError } = await supabase
        .from('computer_assignment_history')
        .insert([{
          computer_id: computer.id,
          user_id: selectedUser,
          assigned_by: user.id,
          notes: assignmentNotes.trim() || null
        }]);

      if (historyError) throw historyError;

      const { error: assignError } = await supabase
        .from('computer_assets')
        .update({
          assigned_to: selectedUser,
          assigned_date: new Date().toISOString(),
        })
        .eq('id', computer.id);

      if (assignError) throw assignError;

      await loadComputerData();
      setShowAssignModal(false);
      setSelectedUser('');
      setAssignmentNotes('');
    } catch (err) {
      console.error('Error assigning computer:', err);
      setError('Failed to assign computer');
    } finally {
      setAssigning(false);
    }
  }

  async function unassignComputer() {
    if (!computer || !user) return;

    try {
      setAssigning(true);

      const { error: historyError } = await supabase
        .from('computer_assignment_history')
        .update({ unassigned_at: new Date().toISOString() })
        .eq('computer_id', computer.id)
        .is('unassigned_at', null);

      if (historyError) throw historyError;

      const { error: unassignError } = await supabase
        .from('computer_assets')
        .update({
          assigned_to: null,
          assigned_date: null,
        })
        .eq('id', computer.id);

      if (unassignError) throw unassignError;

      await loadComputerData();
      setShowAssignModal(false);
    } catch (err) {
      console.error('Error unassigning computer:', err);
      setError('Failed to unassign computer');
    } finally {
      setAssigning(false);
    }
  }

  async function handleStatusChange(newStatus: string) {
    if (!computer || !user || !['admin', 'technician'].includes(userRole)) return;

    try {
      setChangingStatus(true);
      setError(null);

      const { error: updateError } = await supabase
        .from('computer_assets')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', computer.id);

      if (updateError) throw updateError;

      if (newStatus === 'maintenance') {
        const { error: maintenanceError } = await supabase
          .from('computer_maintenance')
          .insert([{
            computer_id: computer.id,
            maintenance_type: 'Status Change',
            description: `Status changed to ${newStatus}`,
            performed_by: user.id,
            notes: 'Automatic entry for status change'
          }]);

        if (maintenanceError) throw maintenanceError;
      }

      await loadComputerData();
    } catch (err) {
      console.error('Error updating computer status:', err);
      setError('Failed to update computer status');
    } finally {
      setChangingStatus(false);
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'desktop': return <Monitor className="w-6 h-6" />;
      case 'laptop': return <Laptop className="w-6 h-6" />;
      case 'workstation': return <HardDrive className="w-6 h-6" />;
      case 'server': return <Server className="w-6 h-6" />;
      default: return <Monitor className="w-6 h-6" />;
    }
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

  const canChangeStatus = ['admin', 'technician'].includes(userRole);
  const canAssignComputers = ['admin', 'technician'].includes(userRole);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (error || !computer) {
    return (
      <div className="rounded-md bg-red-50 p-4">
        <div className="flex">
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">{error || 'Computer not found'}</h3>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/inventory')}
          className="flex items-center text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Inventory
        </button>
        <div className="flex items-center space-x-3">
          {canAssignComputers && (
            <button
              onClick={() => setShowAssignModal(true)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Assign User
            </button>
          )}
          {canChangeStatus ? (
            <select
              value={computer?.status || ''}
              onChange={(e) => handleStatusChange(e.target.value)}
              disabled={changingStatus}
              className={`inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium ${
                changingStatus ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
              } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
            >
              <option value="active">Active</option>
              <option value="maintenance">Maintenance</option>
              <option value="storage">Storage</option>
              <option value="retired">Retired</option>
            </select>
          ) : (
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(computer?.status || '')}`}>
              {computer?.status}
            </span>
          )}
          {computer?.assigned_to && canAssignComputers && (
            <button
              onClick={unassignComputer}
              disabled={assigning}
              className="inline-flex items-center px-4 py-2 border border-red-300 shadow-sm text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50"
            >
              Unassign User
            </button>
          )}
        </div>
      </div>

      <div className="bg-white shadow-sm rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-blue-50 rounded-lg">
                {getTypeIcon(computer.type)}
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">{computer.name}</h1>
                <p className="text-sm text-gray-500">Asset Tag: {computer.asset_tag}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="border-b border-gray-200">
          <nav className="-mb-px flex">
            <button
              onClick={() => setActiveTab('details')}
              className={`py-4 px-6 text-sm font-medium border-b-2 ${
                activeTab === 'details'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Details
            </button>
            <button
              onClick={() => setActiveTab('maintenance')}
              className={`py-4 px-6 text-sm font-medium border-b-2 ${
                activeTab === 'maintenance'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Maintenance History
            </button>
            <button
              onClick={() => setActiveTab('software')}
              className={`py-4 px-6 text-sm font-medium border-b-2 ${
                activeTab === 'software'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Software
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`py-4 px-6 text-sm font-medium border-b-2 ${
                activeTab === 'history'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Assignment History
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'details' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Hardware Information</h3>
                <dl className="space-y-4">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Manufacturer</dt>
                    <dd className="text-sm text-gray-900">{computer.manufacturer}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Model</dt>
                    <dd className="text-sm text-gray-900">{computer.model}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Serial Number</dt>
                    <dd className="text-sm text-gray-900">{computer.serial_number}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Type</dt>
                    <dd className="text-sm text-gray-900">{computer.type}</dd>
                  </div>
                </dl>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Assignment & Location</h3>
                <dl className="space-y-4">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Assigned To</dt>
                    <dd className="text-sm text-gray-900">
                      {computer.assigned_to ? (
                        <>
                          {computer.assigned_to.full_name}<br />
                          <span className="text-gray-500">{computer.assigned_to.email}</span>
                        </>
                      ) : (
                        'Unassigned'
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Department</dt>
                    <dd className="text-sm text-gray-900">{computer.department || '-'}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Location</dt>
                    <dd className="text-sm text-gray-900">{computer.location || '-'}</dd>
                  </div>
                </dl>
              </div>

              {computer.specifications && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Specifications</h3>
                  <dl className="space-y-4">
                    {Object.entries(computer.specifications).map(([key, value]) => (
                      <div key={key}>
                        <dt className="text-sm font-medium text-gray-500">{key}</dt>
                        <dd className="text-sm text-gray-900">{value as string}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              )}

              {computer.notes && (
                <div className="md:col-span-2">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Notes</h3>
                  <p className="text-sm text-gray-900 whitespace-pre-wrap">{computer.notes}</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'maintenance' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">Maintenance History</h3>
                <button
                  onClick={() => {/* Add maintenance record */}}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                >
                  <Tool className="w-4 h-4 mr-2" />
                  Add Record
                </button>
              </div>

              <div className="space-y-4">
                {maintenance.map((record) => (
                  <div key={record.id} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">{record.maintenance_type}</h4>
                        <p className="mt-1 text-sm text-gray-500">{record.description}</p>
                      </div>
                      <span className="text-sm text-gray-500">
                        {format(new Date(record.performed_at), 'MMM d, yyyy')}
                      </span>
                    </div>
                    <div className="mt-4 text-sm">
                      <div className="flex justify-between text-gray-500">
                        <span>Performed by: {record.performed_by.full_name}</span>
                        <span>Cost: ${record.cost}</span>
                      </div>
                      {record.next_maintenance_date && (
                        <div className="mt-2 flex items-center text-yellow-600">
                          <Calendar className="w-4 h-4 mr-2" />
                          Next maintenance due: {format(new Date(record.next_maintenance_date), 'MMM d, yyyy')}
                        </div>
                      )}
                      {record.notes && (
                        <p className="mt-2 text-gray-700">{record.notes}</p>
                      )}
                    </div>
                  </div>
                ))}
                {maintenance.length === 0 && (
                  <p className="text-center text-gray-500 py-4">No maintenance records found</p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'software' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">Installed Software</h3>
                <button
                  onClick={() => {/* Add software */}}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                >
                  <Package className="w-4 h-4 mr-2" />
                  Add Software
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Software
                      </th>
                      <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Version
                      </th>
                      <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        License Key
                      </th>
                      <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Installation Date
                      </th>
                      <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Expiry Date
                      </th>
                      <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {software.map((sw) => (
                      <tr key={sw.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {sw.software_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {sw.version}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {sw.license_key}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {sw.installation_date ? format(new Date(sw.installation_date), 'MMM d, yyyy') : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {sw.expiry_date ? format(new Date(sw.expiry_date), 'MMM d, yyyy') : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            sw.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {sw.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {software.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                          No software records found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-6">
              <div className="overflow-hidden">
                <div className="flow-root">
                  <ul className="-mb-8">
                    {assignmentHistory.map((record, recordIdx) => (
                      <li key={record.id}>
                        <div className="relative pb-8">
                          {recordIdx !== assignmentHistory.length - 1 ? (
                            <span
                              className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                              aria-hidden="true"
                            />
                          ) : null}
                          <div className="relative flex space-x-3">
                            <div>
                              <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white ${
                                record.unassigned_at ? 'bg-red-100' : 'bg-green-100'
                              }`}>
                                <History className={`h-5 w-5 ${
                                  record.unassigned_at ? 'text-red-500' : 'text-green-500'
                                }`} />
                              </span>
                            </div>
                            <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                              <div>
                                <p className="text-sm text-gray-500">
                                  {record.unassigned_at ? (
                                    <span>
                                      <span className="font-medium text-gray-900">{record.user.full_name}</span> was unassigned
                                    </span>
                                  ) : (
                                    <span>
                                      Assigned to <span className="font-medium text-gray-900">{record.user.full_name}</span>
                                    </span>
                                  )}
                                  {' by '}
                                  <span className="font-medium text-gray-900">{record.assigned_by.full_name}</span>
                                </p>
                                {record.notes && (
                                  <p className="mt-2 text-sm text-gray-500">{record.notes}</p>
                                )}
                              </div>
                              <div className="whitespace-nowrap text-right text-sm text-gray-500">
                                <time dateTime={record.unassigned_at || record.assigned_at}>
                                  {format(new Date(record.unassigned_at || record.assigned_at), 'MMM d, yyyy h:mm a')}
                                </time>
                              </div>
                            </div>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {showAssignModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Assign Computer</h3>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="staff" className="block text-sm font-medium text-gray-700">
                  Select Staff Member
                </label>
                <select
                  id="staff"
                  value={selectedUser}
                  onChange={(e) => setSelectedUser(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                >
                  <option value="">Select a staff member</option>
                  {users.map((staff) => (
                    <option key={staff.id} value={staff.id}>
                      {staff.full_name} ({staff.department})
                    </option>
                   ))}
                </select>
              </div>

              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                  Notes (optional)
                </label>
                <textarea
                  id="notes"
                  value={assignmentNotes}
                  onChange={(e) => setAssignmentNotes(e.target.value)}
                  rows={3}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  placeholder="Add any relevant notes about this assignment"
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowAssignModal(false);
                    setSelectedUser('');
                    setAssignmentNotes('');
                  }}
                  className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancel
                </button>
                {computer.assigned_to && (
                  <button
                    type="button"
                    onClick={unassignComputer}
                    disabled={assigning}
                    className="px-4 py-2 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50"
                  >
                    Unassign
                  </button>
                )}
                <button
                  type="button"
                  onClick={assignComputer}
                  disabled={!selectedUser || assigning}
                  className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                >
                  {assigning ? 'Assigning...' : 'Assign'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}