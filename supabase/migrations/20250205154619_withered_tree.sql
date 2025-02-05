/*
  # Fix Computer Inventory RLS Policies

  1. Changes
    - Simplify computer assets policies
    - Add missing DELETE policies
    - Fix role-based access for technicians and admins
    - Ensure proper access to related tables

  2. Security
    - Maintains data isolation
    - Preserves role-based access
    - Prevents recursion issues
*/

-- Drop existing computer-related policies
DROP POLICY IF EXISTS "assets_select_policy" ON computer_assets;
DROP POLICY IF EXISTS "assets_modify_policy" ON computer_assets;
DROP POLICY IF EXISTS "maintenance_select_policy" ON computer_maintenance;
DROP POLICY IF EXISTS "maintenance_modify_policy" ON computer_maintenance;
DROP POLICY IF EXISTS "software_select_policy" ON computer_software;
DROP POLICY IF EXISTS "software_modify_policy" ON computer_software;
DROP POLICY IF EXISTS "history_select_policy" ON computer_assignment_history;
DROP POLICY IF EXISTS "history_modify_policy" ON computer_assignment_history;

-- Computer Assets Policies
CREATE POLICY "computer_assets_read" ON computer_assets
  FOR SELECT USING (
    -- Users can see their assigned computers
    assigned_to = auth.uid() OR
    -- Staff can see all computers
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role::text IN ('technician', 'admin')
    )
  );

CREATE POLICY "computer_assets_insert" ON computer_assets
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role::text IN ('technician', 'admin')
    )
  );

CREATE POLICY "computer_assets_update" ON computer_assets
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role::text IN ('technician', 'admin')
    )
  );

CREATE POLICY "computer_assets_delete" ON computer_assets
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role::text = 'admin'
    )
  );

-- Maintenance Records Policies
CREATE POLICY "maintenance_read" ON computer_maintenance
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM computer_assets
      WHERE computer_assets.id = computer_id
      AND (
        computer_assets.assigned_to = auth.uid() OR
        EXISTS (
          SELECT 1 FROM users
          WHERE users.id = auth.uid()
          AND users.role::text IN ('technician', 'admin')
        )
      )
    )
  );

CREATE POLICY "maintenance_modify" ON computer_maintenance
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role::text IN ('technician', 'admin')
    )
  );

-- Software Records Policies
CREATE POLICY "software_read" ON computer_software
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM computer_assets
      WHERE computer_assets.id = computer_id
      AND (
        computer_assets.assigned_to = auth.uid() OR
        EXISTS (
          SELECT 1 FROM users
          WHERE users.id = auth.uid()
          AND users.role::text IN ('technician', 'admin')
        )
      )
    )
  );

CREATE POLICY "software_modify" ON computer_software
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role::text IN ('technician', 'admin')
    )
  );

-- Assignment History Policies
CREATE POLICY "assignment_history_read" ON computer_assignment_history
  FOR SELECT USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role::text IN ('technician', 'admin')
    )
  );

CREATE POLICY "assignment_history_insert" ON computer_assignment_history
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role::text IN ('technician', 'admin')
    )
  );

CREATE POLICY "assignment_history_update" ON computer_assignment_history
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role::text IN ('technician', 'admin')
    )
  );