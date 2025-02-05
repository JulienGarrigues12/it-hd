import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { BarChart3, Clock, Users, Monitor, Download } from 'lucide-react';
import * as XLSX from 'xlsx';

interface TicketStats {
  status: string;
  priority: string;
  type: string;
  count: number;
}

interface ResponseTimes {
  avg_first_response: string;
  avg_resolution_time: string;
  tickets_resolved: number;
}

interface TechnicianStats {
  technician_id: string;
  technician_name: string;
  tickets_assigned: number;
  tickets_resolved: number;
  avg_resolution_time: string;
}

interface ComputerStats {
  total_computers: number;
  active_computers: number;
  in_maintenance: number;
  retired_computers: number;
  unassigned_computers: number;
  computers_by_type: Record<string, number>;
  computers_by_department: Record<string, number>;
}

interface BacklogStats {
  age_range: string;
  ticket_count: number;
  priority_breakdown: Record<string, number>;
  type_breakdown: Record<string, number>;
}

export default function Statistics() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [ticketStats, setTicketStats] = useState<TicketStats[]>([]);
  const [responseTimes, setResponseTimes] = useState<ResponseTimes | null>(null);
  const [technicianStats, setTechnicianStats] = useState<TechnicianStats[]>([]);
  const [computerStats, setComputerStats] = useState<ComputerStats | null>(null);
  const [backlogStats, setBacklogStats] = useState<BacklogStats[]>([]);
  const [backlogCutoff, setBacklogCutoff] = useState(7);

  useEffect(() => {
    loadStatistics();
  }, [timeRange, backlogCutoff]);

  async function loadStatistics() {
    try {
      setLoading(true);
      setError(null);

      const startDate = new Date();
      switch (timeRange) {
        case '7d':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case '90d':
          startDate.setDate(startDate.getDate() - 90);
          break;
        default:
          startDate.setDate(startDate.getDate() - 30);
      }

      // Get ticket statistics
      const { data: ticketData, error: ticketError } = await supabase
        .rpc('get_ticket_stats', {
          start_date: startDate.toISOString(),
          end_date: new Date().toISOString()
        });

      if (ticketError) throw ticketError;
      setTicketStats(ticketData || []);

      // Get response times
      const { data: responseData, error: responseError } = await supabase
        .rpc('get_response_times', {
          start_date: startDate.toISOString(),
          end_date: new Date().toISOString()
        });

      if (responseError) throw responseError;
      setResponseTimes(responseData?.[0] || null);

      // Get technician statistics
      const { data: techData, error: techError } = await supabase
        .rpc('get_technician_stats', {
          start_date: startDate.toISOString(),
          end_date: new Date().toISOString()
        });

      if (techError) throw techError;
      setTechnicianStats(techData || []);

      // Get computer statistics
      const { data: computerData, error: computerError } = await supabase
        .rpc('get_computer_stats');

      if (computerError) throw computerError;
      setComputerStats(computerData?.[0] || null);

      // Get backlog statistics
      const { data: backlogData, error: backlogError } = await supabase
        .rpc('get_backlog_stats', {
          cutoff_days: backlogCutoff
        });

      if (backlogError) throw backlogError;
      setBacklogStats(backlogData || []);

    } catch (err) {
      console.error('Error loading statistics:', err);
      setError('Failed to load statistics');
    } finally {
      setLoading(false);
    }
  }

  const exportToExcel = () => {
    try {
      const workbook = XLSX.utils.book_new();

      // Ticket Statistics
      const ticketStatsData = ticketStats.map(stat => ({
        Status: stat.status,
        Priority: stat.priority,
        Type: stat.type,
        Count: stat.count
      }));
      const ticketStatsSheet = XLSX.utils.json_to_sheet(ticketStatsData);
      XLSX.utils.book_append_sheet(workbook, ticketStatsSheet, 'Ticket Statistics');

      // Response Times
      const responseTimesData = [{
        'Average First Response': responseTimes?.avg_first_response,
        'Average Resolution Time': responseTimes?.avg_resolution_time,
        'Tickets Resolved': responseTimes?.tickets_resolved
      }];
      const responseTimesSheet = XLSX.utils.json_to_sheet(responseTimesData);
      XLSX.utils.book_append_sheet(workbook, responseTimesSheet, 'Response Times');

      // Technician Performance
      const technicianData = technicianStats.map(tech => ({
        Name: tech.technician_name,
        'Tickets Assigned': tech.tickets_assigned,
        'Tickets Resolved': tech.tickets_resolved,
        'Average Resolution Time': tech.avg_resolution_time
      }));
      const technicianSheet = XLSX.utils.json_to_sheet(technicianData);
      XLSX.utils.book_append_sheet(workbook, technicianSheet, 'Technician Performance');

      // Computer Inventory
      const computerData = [{
        'Total Computers': computerStats?.total_computers,
        'Active Computers': computerStats?.active_computers,
        'In Maintenance': computerStats?.in_maintenance,
        'Retired Computers': computerStats?.retired_computers,
        'Unassigned Computers': computerStats?.unassigned_computers
      }];
      const computerSheet = XLSX.utils.json_to_sheet(computerData);
      XLSX.utils.book_append_sheet(workbook, computerSheet, 'Computer Inventory');

      // Backlog Statistics
      const backlogData = backlogStats.map(stat => ({
        'Age Range': stat.age_range,
        'Ticket Count': stat.ticket_count,
        'Priority Breakdown': JSON.stringify(stat.priority_breakdown),
        'Type Breakdown': JSON.stringify(stat.type_breakdown)
      }));
      const backlogSheet = XLSX.utils.json_to_sheet(backlogData);
      XLSX.utils.book_append_sheet(workbook, backlogSheet, 'Backlog Analysis');

      // Save the file
      XLSX.writeFile(workbook, 'help-desk-statistics.xlsx');
    } catch (err) {
      console.error('Error exporting to Excel:', err);
      setError('Failed to export statistics');
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
        <h1 className="text-2xl font-semibold text-gray-900">Statistics</h1>
        <div className="flex items-center space-x-4">
          <div className="flex space-x-2">
            <button
              onClick={() => setTimeRange('7d')}
              className={`px-3 py-2 text-sm font-medium rounded-md ${
                timeRange === '7d'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Last 7 Days
            </button>
            <button
              onClick={() => setTimeRange('30d')}
              className={`px-3 py-2 text-sm font-medium rounded-md ${
                timeRange === '30d'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Last 30 Days
            </button>
            <button
              onClick={() => setTimeRange('90d')}
              className={`px-3 py-2 text-sm font-medium rounded-md ${
                timeRange === '90d'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Last 90 Days
            </button>
          </div>
          <button
            onClick={exportToExcel}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Download className="w-4 h-4 mr-2" />
            Export to Excel
          </button>
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Tickets</p>
              <p className="text-2xl font-semibold text-gray-900">
                {ticketStats.reduce((sum, stat) => sum + Number(stat.count), 0)}
              </p>
            </div>
            <div className="p-3 bg-blue-50 rounded-full">
              <BarChart3 className="w-6 h-6 text-blue-500" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg. Response Time</p>
              <p className="text-2xl font-semibold text-gray-900">
                {responseTimes?.avg_first_response?.split(':')[0] || '0'}h
              </p>
            </div>
            <div className="p-3 bg-yellow-50 rounded-full">
              <Clock className="w-6 h-6 text-yellow-500" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Technicians</p>
              <p className="text-2xl font-semibold text-gray-900">
                {technicianStats.length}
              </p>
            </div>
            <div className="p-3 bg-green-50 rounded-full">
              <Users className="w-6 h-6 text-green-500" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Computers</p>
              <p className="text-2xl font-semibold text-gray-900">
                {computerStats?.total_computers || 0}
              </p>
            </div>
            <div className="p-3 bg-purple-50 rounded-full">
              <Monitor className="w-6 h-6 text-purple-500" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Tickets by Status</h2>
          <div className="space-y-4">
            {Object.entries(
              ticketStats.reduce((acc, stat) => {
                acc[stat.status] = (acc[stat.status] || 0) + Number(stat.count);
                return acc;
              }, {} as Record<string, number>)
            ).map(([status, count]) => (
              <div key={status} className="flex items-center">
                <div className="w-32 text-sm text-gray-500">{status}</div>
                <div className="flex-1">
                  <div className="relative h-4 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="absolute h-full bg-blue-500"
                      style={{
                        width: `${(count / ticketStats.reduce((sum, stat) => sum + Number(stat.count), 0)) * 100}%`
                      }}
                    />
                  </div>
                </div>
                <div className="w-16 text-right text-sm text-gray-500">{count}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Technician Performance</h2>
          <div className="space-y-6">
            {technicianStats.map((tech) => (
              <div key={tech.technician_id}>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-900">{tech.technician_name}</span>
                  <span className="text-sm text-gray-500">
                    {tech.tickets_resolved} / {tech.tickets_assigned} tickets
                  </span>
                </div>
                <div className="relative h-4 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="absolute h-full bg-green-500"
                    style={{
                      width: `${(tech.tickets_resolved / tech.tickets_assigned) * 100}%`
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Computer Inventory Status</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">By Status</h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Active</span>
                  <span className="text-sm font-medium text-gray-900">
                    {computerStats?.active_computers || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">In Maintenance</span>
                  <span className="text-sm font-medium text-gray-900">
                    {computerStats?.in_maintenance || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Retired</span>
                  <span className="text-sm font-medium text-gray-900">
                    {computerStats?.retired_computers || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Unassigned</span>
                  <span className="text-sm font-medium text-gray-900">
                    {computerStats?.unassigned_computers || 0}
                  </span>
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">By Type</h3>
              <div className="space-y-2">
                {computerStats?.computers_by_type && 
                  Object.entries(computerStats.computers_by_type).map(([type, count]) => (
                    <div key={type} className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">{type}</span>
                      <span className="text-sm font-medium text-gray-900">{count}</span>
                    </div>
                  ))
                }
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Response Time Analysis</h2>
          <div className="space-y-6">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-500">Average First Response</span>
                <span className="text-sm font-medium text-gray-900">
                  {responseTimes?.avg_first_response?.split(':')[0] || '0'}h {responseTimes?.avg_first_response?.split(':')[1] || '0'}m
                </span>
              </div>
              <div className="relative h-4 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="absolute h-full bg-blue-500"
                  style={{
                    width: '100%'
                  }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-500">Average Resolution Time</span>
                <span className="text-sm font-medium text-gray-900">
                  {responseTimes?.avg_resolution_time?.split(':')[0] || '0'}h {responseTimes?.avg_resolution_time?.split(':')[1] || '0'}m
                </span>
              </div>
              <div className="relative h-4 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="absolute h-full bg-green-500"
                  style={{
                    width: '100%'
                  }}
                />
              </div>
            </div>
            <div className="text-center text-sm text-gray-500">
              Total Resolved Tickets: {responseTimes?.tickets_resolved || 0}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-medium text-gray-900">Backlog Analysis</h2>
          <select
            value={backlogCutoff}
            onChange={(e) => setBacklogCutoff(Number(e.target.value))}
            className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          >
            <option value={7}>7 Days Cutoff</option>
            <option value={14}>14 Days Cutoff</option>
            <option value={30}>30 Days Cutoff</option>
          </select>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {backlogStats.map((stat) => (
            <div key={stat.age_range} className="bg-gray-50 rounded-lg p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-medium text-gray-900">{stat.age_range}</h3>
                <span className="text-2xl font-semibold text-gray-900">{stat.ticket_count}</span>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h4 className="text-xs font-medium text-gray-500 mb-2">By Priority</h4>
                  <div className="space-y-1">
                    {Object.entries(stat.priority_breakdown || {}).map(([priority, count]) => (
                      <div key={priority} className="flex justify-between items-center">
                        <span className="text-xs text-gray-500">{priority}</span>
                        <span className="text-xs font-medium text-gray-900">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h4 className="text-xs font-medium text-gray-500 mb-2">By Type</h4>
                  <div className="space-y-1">
                    {Object.entries(stat.type_breakdown || {}).map(([type, count]) => (
                      <div key={type} className="flex justify-between items-center">
                        <span className="text-xs text-gray-500">{type}</span>
                        <span className="text-xs font-medium text-gray-900">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}