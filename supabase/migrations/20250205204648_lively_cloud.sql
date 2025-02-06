/*
  # Fix Computer Assets RLS Policies - Version 2

  1. Changes
    - Temporarily disable RLS to verify table access
    - Re-enable RLS with simplified policies
    - Add explicit INSERT policy for authenticated users with proper roles
    
  2. Security
    - Maintain security while fixing access issues
    - Ensure proper role checks
*/

-- Temporarily disable RLS to verify table access
ALTER TABLE computer_assets DISABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "computer_assets_read" ON computer_assets;
DROP POLICY IF EXISTS "computer_assets_insert" ON computer_assets;
DROP POLICY IF EXISTS "computer_assets_update" ON computer_assets;
DROP POLICY IF EXISTS "computer_assets_delete" ON computer_assets;

-- Re-enable RLS
ALTER TABLE computer_assets ENABLE ROW LEVEL SECURITY;

-- Create simplified policies
CREATE POLICY "allow_read" ON computer_assets
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "allow_insert" ON computer_assets
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('technician', 'admin')
    )
  );

CREATE POLICY "allow_update" ON computer_assets
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('technician', 'admin')
    )
  );

CREATE POLICY "allow_delete" ON computer_assets
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Grant necessary permissions
GRANT ALL ON computer_assets TO authenticated;