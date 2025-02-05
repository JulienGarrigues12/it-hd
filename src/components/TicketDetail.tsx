import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Clock, AlertCircle, CheckCircle, ArrowLeft, User, Calendar, Tag, MessageSquare } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { format } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';

interface Ticket {
  id: string;
  title: string;
  description: string;
  type: string;
  priority: string;
  status: string;
  created_at: string;
  updated_at: string;
  category: { name: string };
  requestor: { full_name: string; email: string };
  assignee: { full_name: string; email: string } | null;
}

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user: { full_name: string };
}

interface UserRole {
  role: 'user' | 'technician' | 'admin';
}

export default function TicketDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [userRole, setUserRole] = useState<string>('user');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    if (user) {
      loadTicketData();
      loadUserRole();
    }
  }, [id, user]);

  async function loadUserRole() {
    if (!user) return;
    
    try {
      // First try to get the user role
      const { data, error } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setUserRole(data.role);
      } else {
        // If user doesn't exist, create a new user profile
        const { error: insertError } = await supabase
          .from('users')
          .insert([
            {
              id: user.id,
              email: user.email,
              role: 'user',
              full_name: user.email?.split('@')[0] || 'User'
            }
          ]);

        if (insertError) {
          console.error('Error creating user profile:', insertError);
        } else {
          setUserRole('user');
        }
      }
    } catch (err) {
      console.error('Error loading user role:', err);
      // Default to 'user' role if there's any error
      setUserRole('user');
    }
  }

  async function loadTicketData() {
    try {
      setLoading(true);
      setError(null);

      // Fetch ticket details
      const { data: ticketData, error: ticketError } = await supabase
        .from('tickets')
        .select(`
          *,
          category:ticket_categories(name),
          requestor:requestor_id(full_name, email),
          assignee:assigned_to(full_name, email)
        `)
        .eq('id', id)
        .single();

      if (ticketError) throw ticketError;

      // Fetch comments
      const { data: commentsData, error: commentsError } = await supabase
        .from('ticket_comments')
        .select(`
          *,
          user:user_id(full_name)
        `)
        .eq('ticket_id', id)
        .order('created_at', { ascending: true });

      if (commentsError) throw commentsError;

      setTicket(ticketData);
      setComments(commentsData || []);
    } catch (err) {
      console.error('Error loading ticket data:', err);
      setError('Failed to load ticket data');
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusChange(newStatus: string) {
    if (!user || !ticket) return;

    try {
      setUpdatingStatus(true);
      setError(null);

      const { error } = await supabase
        .from('tickets')
        .update({ status: newStatus })
        .eq('id', ticket.id);

      if (error) throw error;

      // Add a system comment about the status change
      const { error: commentError } = await supabase
        .from('ticket_comments')
        .insert([
          {
            ticket_id: ticket.id,
            user_id: user.id,
            content: `Status changed to ${newStatus.replace('_', ' ')}`
          }
        ]);

      if (commentError) throw commentError;

      await loadTicketData(); // Reload ticket data
    } catch (err) {
      console.error('Error updating ticket status:', err);
      setError('Failed to update ticket status');
    } finally {
      setUpdatingStatus(false);
    }
  }

  async function handleSubmitComment(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !newComment.trim()) return;

    try {
      setSubmitting(true);
      const { error } = await supabase
        .from('ticket_comments')
        .insert([
          {
            ticket_id: id,
            user_id: user.id,
            content: newComment.trim()
          }
        ]);

      if (error) throw error;

      setNewComment('');
      await loadTicketData(); // Reload comments
    } catch (err) {
      console.error('Error submitting comment:', err);
      setError('Failed to submit comment');
    } finally {
      setSubmitting(false);
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open': return <AlertCircle className="w-5 h-5 text-blue-500" />;
      case 'in_progress': return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'resolved': return <CheckCircle className="w-5 h-5 text-green-500" />;
      default: return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
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

  const canChangeStatus = userRole === 'admin' || userRole === 'technician';

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
        {error || 'Ticket not found'}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/tickets')}
          className="flex items-center text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Tickets
        </button>
        <div className="flex items-center space-x-3">
          {canChangeStatus ? (
            <select
              value={ticket.status}
              onChange={(e) => handleStatusChange(e.target.value)}
              disabled={updatingStatus}
              className={`inline-flex items-center px-3 py-1 rounded-md text-sm font-medium border-2 ${
                updatingStatus ? 'opacity-50 cursor-not-allowed' : ''
              } ${getStatusColor(ticket.status)} border-transparent focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
            >
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
          ) : (
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(ticket.status)}`}>
              {getStatusIcon(ticket.status)}
              <span className="ml-2">{ticket.status.replace('_', ' ')}</span>
            </span>
          )}
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(ticket.priority)}`}>
            {ticket.priority}
          </span>
        </div>
      </div>

      <div className="bg-white shadow-sm rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h1 className="text-2xl font-semibold text-gray-900">{ticket.title}</h1>
          <div className="mt-2 flex flex-wrap gap-4 text-sm text-gray-500">
            <div className="flex items-center">
              <User className="w-4 h-4 mr-2" />
              Requested by {ticket.requestor.full_name}
            </div>
            <div className="flex items-center">
              <Calendar className="w-4 h-4 mr-2" />
              {format(new Date(ticket.created_at), 'MMM d, yyyy h:mm a')}
            </div>
            <div className="flex items-center">
              <Tag className="w-4 h-4 mr-2" />
              {ticket.category.name}
            </div>
          </div>
        </div>

        <div className="px-6 py-4">
          <div className="prose max-w-none">
            <p className="text-gray-700 whitespace-pre-wrap">{ticket.description}</p>
          </div>
        </div>

        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900 flex items-center">
              <MessageSquare className="w-5 h-5 mr-2" />
              Comments
            </h2>
          </div>

          <div className="space-y-4">
            {comments.map((comment) => (
              <div key={comment.id} className="bg-white p-4 rounded-lg shadow-sm">
                <div className="flex justify-between items-start">
                  <span className="text-sm font-medium text-gray-900">
                    {comment.user.full_name}
                  </span>
                  <span className="text-xs text-gray-500">
                    {format(new Date(comment.created_at), 'MMM d, yyyy h:mm a')}
                  </span>
                </div>
                <p className="mt-2 text-gray-700 whitespace-pre-wrap">{comment.content}</p>
              </div>
            ))}

            {comments.length === 0 && (
              <p className="text-center text-gray-500 py-4">No comments yet</p>
            )}

            <form onSubmit={handleSubmitComment} className="mt-4">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                rows={3}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                disabled={submitting}
              />
              <div className="mt-3 flex justify-end">
                <button
                  type="submit"
                  disabled={submitting || !newComment.trim()}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Add Comment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}