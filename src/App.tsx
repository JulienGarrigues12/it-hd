import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import TicketList from './components/TicketList';
import TicketDetail from './components/TicketDetail';
import CreateTicket from './components/CreateTicket';
import AdminPanel from './components/AdminPanel';
import UserProfile from './components/UserProfile';
import ComputerInventory from './components/ComputerInventory';
import ComputerDetail from './components/ComputerDetail';
import CreateComputer from './components/CreateComputer';
import Statistics from './components/Statistics';
import Login from './components/Login';
import { AuthProvider } from './contexts/AuthContext';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="tickets" element={<TicketList />} />
            <Route path="tickets/:id" element={<TicketDetail />} />
            <Route path="tickets/new" element={<CreateTicket />} />
            <Route path="admin" element={<AdminPanel />} />
            <Route path="profile" element={<UserProfile />} />
            <Route path="inventory" element={<ComputerInventory />} />
            <Route path="inventory/new" element={<CreateComputer />} />
            <Route path="inventory/:id" element={<ComputerDetail />} />
            <Route path="statistics" element={<Statistics />} />
          </Route>
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;