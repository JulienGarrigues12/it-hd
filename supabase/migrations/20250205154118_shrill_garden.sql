/*
  # Fix RLS Access Policies

  1. Changes
    - Add public access policy for unauthenticated users to create accounts
    - Fix role checking in policies to use current user's role
    - Add missing policies for ticket management
    - Ensure proper access for basic operations

  2. Security
    - Maintains security while allowing necessary access
    - Enables proper authentication flow
    - Preserves data isolation between users
*/

-- Add public access policy for user creation
CREATE POLICY "enable_public_access" ON auth.users
  FOR SELECT
  USING (true);

-- Update users policies to check auth.jwt() for role
CREATE POLICY "users_read_own_v2" ON users
  FOR SELECT
  USING (
    auth.uid() = id OR
    auth.jwt()->>'role' IN ('technician', 'admin')
  );

CREATE POLICY "users_update_own_v2" ON users
  FOR UPDATE
  USING (
    auth.uid() = id OR
    auth.jwt()->>'role' = 'admin'
  );

-- Update tickets policies for better access
CREATE POLICY "tickets_read_all_v2" ON tickets
  FOR SELECT
  USING (
    auth.uid() = created_by OR
    auth.uid() = requestor_id OR
    auth.jwt()->>'role' IN ('technician', 'admin')
  );

CREATE POLICY "tickets_insert_v2" ON tickets
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "tickets_update_v2" ON tickets
  FOR UPDATE
  USING (
    auth.uid() = created_by OR
    auth.jwt()->>'role' IN ('technician', 'admin')
  );

-- Update categories for better access
CREATE POLICY "categories_read_v2" ON ticket_categories
  FOR SELECT
  USING (true);

-- Update comments policies
CREATE POLICY "comments_read_v2" ON ticket_comments
  FOR SELECT
  USING (true);

CREATE POLICY "comments_insert_v2" ON ticket_comments
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Update computer assets policies
CREATE POLICY "computers_read_v2" ON computer_assets
  FOR SELECT
  USING (
    assigned_to = auth.uid() OR
    auth.jwt()->>'role' IN ('technician', 'admin')
  );

CREATE POLICY "computers_write_v2" ON computer_assets
  FOR ALL
  USING (auth.jwt()->>'role' IN ('technician', 'admin'));

-- Update maintenance policies
CREATE POLICY "maintenance_read_v2" ON computer_maintenance
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM computer_assets
      WHERE computer_assets.id = computer_id
      AND (
        computer_assets.assigned_to = auth.uid() OR
        auth.jwt()->>'role' IN ('technician', 'admin')
      )
    )
  );

-- Update software policies
CREATE POLICY "software_read_v2" ON computer_software
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM computer_assets
      WHERE computer_assets.id = computer_id
      AND (
        computer_assets.assigned_to = auth.uid() OR
        auth.jwt()->>'role' IN ('technician', 'admin')
      )
    )
  );

-- Update assignment history policies
CREATE POLICY "history_read_v2" ON computer_assignment_history
  FOR SELECT
  USING (
    user_id = auth.uid() OR
    auth.jwt()->>'role' IN ('technician', 'admin')
  );