/*
  # Fix Row Level Security Policies

  1. Re-enable RLS
    - Enable RLS on all tables
    - Drop existing policies to avoid conflicts
    - Create new policies for each table

  2. Security Overview
    - Users can view their own data
    - Technicians have elevated access
    - Admins have full access
    - Computer assets have specific access rules
*/

-- Re-enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE computer_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE computer_maintenance ENABLE ROW LEVEL SECURITY;
ALTER TABLE computer_software ENABLE ROW LEVEL SECURITY;
ALTER TABLE computer_assignment_history ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Technicians can view all users" ON users;
DROP POLICY IF EXISTS "Admins can manage users" ON users;
DROP POLICY IF EXISTS "Users can view their own tickets" ON tickets;
DROP POLICY IF EXISTS "Users can create tickets" ON tickets;
DROP POLICY IF EXISTS "Technicians can view and manage assigned tickets" ON tickets;
DROP POLICY IF EXISTS "Admins can manage all tickets" ON tickets;
DROP POLICY IF EXISTS "Anyone can view active categories" ON ticket_categories;
DROP POLICY IF EXISTS "Admins can manage categories" ON ticket_categories;
DROP POLICY IF EXISTS "Users can view comments on their tickets" ON ticket_comments;
DROP POLICY IF EXISTS "Users can add comments to their tickets" ON ticket_comments;
DROP POLICY IF EXISTS "Technicians can manage comments on assigned tickets" ON ticket_comments;
DROP POLICY IF EXISTS "Admins can manage all comments" ON ticket_comments;
DROP POLICY IF EXISTS "Users can view attachments on their tickets" ON ticket_attachments;
DROP POLICY IF EXISTS "Users can add attachments to their tickets" ON ticket_attachments;
DROP POLICY IF EXISTS "Technicians can manage attachments on assigned tickets" ON ticket_attachments;
DROP POLICY IF EXISTS "Admins can manage all attachments" ON ticket_attachments;
DROP POLICY IF EXISTS "Users can view their assigned computers" ON computer_assets;
DROP POLICY IF EXISTS "Technicians can view all computers" ON computer_assets;
DROP POLICY IF EXISTS "Technicians can manage computers" ON computer_assets;
DROP POLICY IF EXISTS "Users can view maintenance of their computers" ON computer_maintenance;
DROP POLICY IF EXISTS "Technicians can manage maintenance" ON computer_maintenance;
DROP POLICY IF EXISTS "Users can view software on their computers" ON computer_software;
DROP POLICY IF EXISTS "Technicians can manage software" ON computer_software;
DROP POLICY IF EXISTS "Users can view assignment history of their computers" ON computer_assignment_history;
DROP POLICY IF EXISTS "Technicians can manage assignment history" ON computer_assignment_history;

-- Create new policies

-- Users table policies
CREATE POLICY "view_own_profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "technicians_view_users" ON users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('technician', 'admin')
    )
  );

CREATE POLICY "admins_manage_users" ON users
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- Tickets table policies
CREATE POLICY "view_own_tickets" ON tickets
  FOR SELECT USING (created_by = auth.uid() OR requestor_id = auth.uid());

CREATE POLICY "create_tickets" ON tickets
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "technicians_manage_assigned" ON tickets
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role = 'technician'
      AND (tickets.assigned_to = auth.uid() OR tickets.assigned_to IS NULL)
    )
  );

CREATE POLICY "admins_manage_tickets" ON tickets
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- Categories policies
CREATE POLICY "view_active_categories" ON ticket_categories
  FOR SELECT USING (is_active = true);

CREATE POLICY "admins_manage_categories" ON ticket_categories
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- Comments policies
CREATE POLICY "view_ticket_comments" ON ticket_comments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM tickets
      WHERE tickets.id = ticket_comments.ticket_id
      AND (tickets.created_by = auth.uid() OR tickets.requestor_id = auth.uid())
    )
  );

CREATE POLICY "add_ticket_comments" ON ticket_comments
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM tickets
      WHERE tickets.id = ticket_id
      AND (tickets.created_by = auth.uid() OR tickets.requestor_id = auth.uid())
    )
  );

CREATE POLICY "technicians_manage_comments" ON ticket_comments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role = 'technician'
      AND EXISTS (
        SELECT 1 FROM tickets
        WHERE tickets.id = ticket_comments.ticket_id
        AND (tickets.assigned_to = auth.uid() OR tickets.assigned_to IS NULL)
      )
    )
  );

CREATE POLICY "admins_manage_comments" ON ticket_comments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- Computer assets policies
CREATE POLICY "view_assigned_computers" ON computer_assets
  FOR SELECT USING (assigned_to = auth.uid());

CREATE POLICY "technicians_manage_computers" ON computer_assets
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('technician', 'admin')
    )
  );

-- Maintenance policies
CREATE POLICY "view_computer_maintenance" ON computer_maintenance
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM computer_assets
      WHERE computer_assets.id = computer_id
      AND computer_assets.assigned_to = auth.uid()
    )
  );

CREATE POLICY "technicians_manage_maintenance" ON computer_maintenance
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('technician', 'admin')
    )
  );

-- Software policies
CREATE POLICY "view_computer_software" ON computer_software
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM computer_assets
      WHERE computer_assets.id = computer_id
      AND computer_assets.assigned_to = auth.uid()
    )
  );

CREATE POLICY "technicians_manage_software" ON computer_software
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('technician', 'admin')
    )
  );

-- Assignment history policies
CREATE POLICY "view_assignment_history" ON computer_assignment_history
  FOR SELECT USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM computer_assets
      WHERE computer_assets.id = computer_id
      AND computer_assets.assigned_to = auth.uid()
    )
  );

CREATE POLICY "technicians_manage_history" ON computer_assignment_history
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('technician', 'admin')
    )
  );