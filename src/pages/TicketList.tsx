import React from 'react';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';

export default function TicketList() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Tickets</h1>
        <Link
          to="/tickets/new"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Ticket
        </Link>
      </div>

      <div className="bg-white shadow-sm rounded-lg">
        {/* Add ticket list table here */}
        <div className="p-6 text-center text-gray-500">
          No tickets found. Create a new ticket to get started.
        </div>
      </div>
    </div>
  );
}