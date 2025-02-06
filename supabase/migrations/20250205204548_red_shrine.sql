/*
  # Fix Computer Assets RLS Policies

  1. Changes
    - Drop and recreate computer assets policies with proper INSERT permissions
    - Ensure technicians and admins can create new assets
    - Maintain existing read permissions
    
  2. Security
    - Enable RLS
    - Add policies for all CRUD operations
*/

-- First, drop existing policies
DROP POLICY IF EXISTS "computer_assets_read" ON computer_assets;
DROP POLICY IF EXISTS "computer_assets_insert" ON computer_assets;
DROP POLICY IF EXISTS "computer_assets_update" ON computer_assets;
DROP POLICY IF EXISTS "computer_assets_delete" ON computer_assets;

-- Create new policies with proper permissions
CREATE POLICY "computer_assets_read" ON computer_assets
  FOR SELECT USING (
    -- Users can see their assigned computers
    assigned_to = auth.uid() OR
    -- Staff can see all computers
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('technician', 'admin')
    )
  );

CREATE POLICY "computer_assets_insert" ON computer_assets
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('technician', 'admin')
    )
  );

CREATE POLICY "computer_assets_update" ON computer_assets
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('technician', 'admin')
    )
  );

CREATE POLICY "computer_assets_delete" ON computer_assets
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );