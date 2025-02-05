import React from 'react';
import { BarChart3, Users, Clock, AlertCircle } from 'lucide-react';

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Tickets</p>
              <p className="text-2xl font-semibold text-gray-900">123</p>
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
              <p className="text-2xl font-semibold text-gray-900">45</p>
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
              <p className="text-2xl font-semibold text-gray-900">2.5h</p>
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
              <p className="text-2xl font-semibold text-gray-900">3</p>
            </div>
            <div className="p-3 bg-red-50 rounded-full">
              <AlertCircle className="w-6 h-6 text-red-500" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Tickets</h3>
          {/* Add recent tickets list here */}
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Activity Timeline</h3>
          {/* Add activity timeline here */}
        </div>
      </div>
    </div>
  );
}