import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BarChart3, Users, Clock, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { format } from 'date-fns';

interface Ticket {
  id: string;
  title: string;
  status: string;
  priority: string;
  created_at: string;
  type: string;
  requestor: { full_name: string };
}

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalTickets: 0,
    activeTickets: 0,
    avgResponseTime: '2.5h',
    criticalIssues: 0
  });
  const [recentTickets, setRecentTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      setError(null);

      // Fetch total tickets
      const { data: totalTickets, error: totalError } = await supabase
        .from('tickets')
        .select('id', { count: 'exact' });

      if (totalError) throw totalError;

      // Fetch active tickets (open or in_progress)
      const { data: activeTickets, error: activeError } = await supabase
        .from('tickets')
        .select('id', { count: 'exact' })
        .in('status', ['open', 'in_progress']);

      if (activeError) throw activeError;

      // Fetch critical issues
      const { data: criticalIssues, error: criticalError } = await supabase
        .from('tickets')
        .select('id', { count: 'exact' })
        .eq('priority', 'critical')
        .in('status', ['open', 'in_progress']);

      if (criticalError) throw criticalError;

      // Fetch recent tickets, ordered by priority and creation date
      const { data: recent, error: recentError } = await supabase
        .from('tickets')
        .select(`
          *,
          requestor:requestor_id(full_name)
        `)
        .in('status', ['open', 'in_progress'])
        .order('priority', { ascending: false }) // Order by priority first (critical -> high -> medium -> low)
        .order('created_at', { ascending: false }) // Then by creation date
        .limit(5);

      if (recentError) throw recentError;

      setStats({
        totalTickets: totalTickets?.length || 0,
        activeTickets: activeTickets?.length || 0,
        avgResponseTime: '2.5h',
        criticalIssues: criticalIssues?.length || 0
      });

      setRecentTickets(recent || []);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Tickets</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalTickets}</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-full">
              <BarChart3 className="w-6 h-6 text-blue-500" />
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Tickets</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.activeTickets}</p>
            </div>
            <div className="p-3 bg-green-50 rounded-full">
              <Users className="w-6 h-6 text-green-500" />
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg. Response Time</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.avgResponseTime}</p>
            </div>
            <div className="p-3 bg-yellow-50 rounded-full">
              <Clock className="w-6 h-6 text-yellow-500" />
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Critical Issues</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.criticalIssues}</p>
            </div>
            <div className="p-3 bg-red-50 rounded-full">
              <AlertCircle className="w-6 h-6 text-red-500" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Ongoing Tickets</h3>
            <Link
              to="/tickets"
              className="text-sm text-blue-600 hover:text-blue-900"
            >
              View all
            </Link>
          </div>
          <div className="space-y-4">
            {recentTickets.length > 0 ? (
              recentTickets.map((ticket) => (
                <Link
                  key={ticket.id}
                  to={`/tickets/${ticket.id}`}
                  className="block p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-gray-900">{ticket.title}</h4>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
                          {ticket.priority}
                        </span>
                        <span className="text-xs text-gray-500">
                          Requested by {ticket.requestor?.full_name}
                        </span>
                      </div>
                    </div>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}>
                      {ticket.status.replace('_', ' ')}
                    </span>
                  </div>
                </Link>
              ))
            ) : (
              <p className="text-center text-gray-500">No ongoing tickets</p>
            )}
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Activity Timeline</h3>
          <div className="space-y-4">
            {recentTickets.map((ticket) => (
              <div key={ticket.id} className="relative pl-6 pb-4 border-l border-gray-200 last:pb-0">
                <div className="absolute left-0 top-2 -ml-1.5 h-3 w-3 rounded-full border-2 border-white bg-gray-300" />
                <div>
                  <p className="text-sm text-gray-600">
                    New {ticket.type} ticket created by {ticket.requestor?.full_name}
                  </p>
                  <p className="mt-0.5 text-xs text-gray-500">
                    {format(new Date(ticket.created_at), 'MMM d, yyyy h:mm a')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}