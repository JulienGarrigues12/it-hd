import React from 'react';
import { useParams } from 'react-router-dom';

export default function TicketDetail() {
  const { id } = useParams();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Ticket #{id}</h1>
      </div>

      <div className="bg-white shadow-sm rounded-lg p-6">
        <p className="text-gray-500">Ticket details will be displayed here.</p>
      </div>
    </div>
  );
}