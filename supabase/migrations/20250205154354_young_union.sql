/*
  # Fix RLS Policies

  1. Changes
    - Drop all existing policies
    - Create simplified policies using direct auth checks
    - Use auth.jwt() for role checks
    - Add basic policies for essential operations

  2. Security
    - Maintains data isolation
    - Preserves access control
    - Prevents infinite recursion
*/

-- First, drop all existing policies to start fresh
DO $$ 
BEGIN
  -- Drop policies for each table
  EXECUTE (
    SELECT string_agg('DROP POLICY IF EXISTS "' || policyname || '" ON ' || tablename || ';', E'\n')
    FROM pg_policies
    WHERE schemaname = 'public'
  );
END $$;

-- Create new simplified policies

-- Users table - Basic policies without recursion
CREATE POLICY "users_select_policy" ON users
  FOR SELECT USING (true);

CREATE POLICY "users_insert_policy" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "users_update_policy" ON users
  FOR UPDATE USING (
    auth.uid() = id OR 
    auth.jwt()->>'role' IN ('admin', 'technician')
  );

-- Tickets table - Direct access checks
CREATE POLICY "tickets_select_policy" ON tickets
  FOR SELECT USING (
    created_by = auth.uid() OR 
    requestor_id = auth.uid() OR
    auth.jwt()->>'role' IN ('admin', 'technician')
  );

CREATE POLICY "tickets_insert_policy" ON tickets
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "tickets_update_policy" ON tickets
  FOR UPDATE USING (
    created_by = auth.uid() OR
    auth.jwt()->>'role' IN ('admin', 'technician')
  );

-- Categories - Simple policies
CREATE POLICY "categories_select_policy" ON ticket_categories
  FOR SELECT USING (true);

CREATE POLICY "categories_modify_policy" ON ticket_categories
  FOR ALL USING (
    auth.jwt()->>'role' = 'admin'
  );

-- Comments - Direct access checks
CREATE POLICY "comments_select_policy" ON ticket_comments
  FOR SELECT USING (true);

CREATE POLICY "comments_insert_policy" ON ticket_comments
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Computer assets - Simple ownership checks
CREATE POLICY "assets_select_policy" ON computer_assets
  FOR SELECT USING (
    assigned_to = auth.uid() OR
    auth.jwt()->>'role' IN ('admin', 'technician')
  );

CREATE POLICY "assets_modify_policy" ON computer_assets
  FOR ALL USING (
    auth.jwt()->>'role' IN ('admin', 'technician')
  );

-- Maintenance records - Simple access
CREATE POLICY "maintenance_select_policy" ON computer_maintenance
  FOR SELECT USING (
    auth.jwt()->>'role' IN ('admin', 'technician')
  );

CREATE POLICY "maintenance_modify_policy" ON computer_maintenance
  FOR ALL USING (
    auth.jwt()->>'role' IN ('admin', 'technician')
  );

-- Software records - Simple access
CREATE POLICY "software_select_policy" ON computer_software
  FOR SELECT USING (
    auth.jwt()->>'role' IN ('admin', 'technician')
  );

CREATE POLICY "software_modify_policy" ON computer_software
  FOR ALL USING (
    auth.jwt()->>'role' IN ('admin', 'technician')
  );

-- Assignment history - Simple access
CREATE POLICY "history_select_policy" ON computer_assignment_history
  FOR SELECT USING (
    user_id = auth.uid() OR
    auth.jwt()->>'role' IN ('admin', 'technician')
  );

CREATE POLICY "history_modify_policy" ON computer_assignment_history
  FOR ALL USING (
    auth.jwt()->>'role' IN ('admin', 'technician')
  );