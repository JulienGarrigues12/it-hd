/*
  # Fix RLS Policies

  1. Changes
    - Remove recursive policy checks
    - Fix role checking to use auth.jwt()
    - Simplify policy conditions
    - Enable proper data access

  2. Security
    - Maintains proper access control
    - Prevents infinite recursion
    - Preserves data isolation
*/

-- Drop existing policies
DROP POLICY IF EXISTS "users_read_own" ON users;
DROP POLICY IF EXISTS "users_read_all_tech_admin" ON users;
DROP POLICY IF EXISTS "users_manage_admin" ON users;
DROP POLICY IF EXISTS "tickets_read_own" ON tickets;
DROP POLICY IF EXISTS "tickets_create" ON tickets;
DROP POLICY IF EXISTS "tickets_manage_tech" ON tickets;
DROP POLICY IF EXISTS "tickets_manage_admin" ON tickets;

-- Create new policies without recursion

-- Users policies
CREATE POLICY "allow_read_own_profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "allow_read_all_users_for_staff" ON users
  FOR SELECT USING (
    auth.jwt()->>'role' IN ('technician', 'admin')
  );

CREATE POLICY "allow_admin_manage_users" ON users
  FOR ALL USING (
    auth.jwt()->>'role' = 'admin'
  );

-- Tickets policies
CREATE POLICY "allow_read_own_tickets" ON tickets
  FOR SELECT USING (
    created_by = auth.uid() OR 
    requestor_id = auth.uid() OR
    auth.jwt()->>'role' IN ('technician', 'admin')
  );

CREATE POLICY "allow_create_tickets" ON tickets
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "allow_staff_manage_tickets" ON tickets
  FOR UPDATE USING (
    auth.jwt()->>'role' IN ('technician', 'admin')
  );

-- Categories policies
CREATE POLICY "allow_read_categories" ON ticket_categories
  FOR SELECT USING (true);

CREATE POLICY "allow_admin_manage_categories" ON ticket_categories
  FOR ALL USING (
    auth.jwt()->>'role' = 'admin'
  );

-- Comments policies
CREATE POLICY "allow_read_ticket_comments" ON ticket_comments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM tickets
      WHERE tickets.id = ticket_id
      AND (
        tickets.created_by = auth.uid() OR
        tickets.requestor_id = auth.uid() OR
        auth.jwt()->>'role' IN ('technician', 'admin')
      )
    )
  );

CREATE POLICY "allow_create_comments" ON ticket_comments
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Computer assets policies
CREATE POLICY "allow_read_assigned_computers" ON computer_assets
  FOR SELECT USING (
    assigned_to = auth.uid() OR
    auth.jwt()->>'role' IN ('technician', 'admin')
  );

CREATE POLICY "allow_staff_manage_computers" ON computer_assets
  FOR ALL USING (
    auth.jwt()->>'role' IN ('technician', 'admin')
  );

-- Maintenance policies
CREATE POLICY "allow_read_maintenance" ON computer_maintenance
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM computer_assets
      WHERE computer_assets.id = computer_id
      AND (
        computer_assets.assigned_to = auth.uid() OR
        auth.jwt()->>'role' IN ('technician', 'admin')
      )
    )
  );

CREATE POLICY "allow_staff_manage_maintenance" ON computer_maintenance
  FOR ALL USING (
    auth.jwt()->>'role' IN ('technician', 'admin')
  );

-- Software policies
CREATE POLICY "allow_read_software" ON computer_software
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM computer_assets
      WHERE computer_assets.id = computer_id
      AND (
        computer_assets.assigned_to = auth.uid() OR
        auth.jwt()->>'role' IN ('technician', 'admin')
      )
    )
  );

CREATE POLICY "allow_staff_manage_software" ON computer_software
  FOR ALL USING (
    auth.jwt()->>'role' IN ('technician', 'admin')
  );

-- Assignment history policies
CREATE POLICY "allow_read_assignment_history" ON computer_assignment_history
  FOR SELECT USING (
    user_id = auth.uid() OR
    auth.jwt()->>'role' IN ('technician', 'admin')
  );

CREATE POLICY "allow_staff_manage_history" ON computer_assignment_history
  FOR ALL USING (
    auth.jwt()->>'role' IN ('technician', 'admin')
  );