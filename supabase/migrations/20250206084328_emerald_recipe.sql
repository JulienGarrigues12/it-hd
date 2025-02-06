-- Drop existing policies
DROP POLICY IF EXISTS "categories_select_policy" ON ticket_categories;
DROP POLICY IF EXISTS "categories_modify_policy" ON ticket_categories;
DROP POLICY IF EXISTS "allow_read_categories" ON ticket_categories;
DROP POLICY IF EXISTS "allow_admin_manage_categories" ON ticket_categories;
DROP POLICY IF EXISTS "All authenticated users can view active categories" ON ticket_categories;
DROP POLICY IF EXISTS "Admins can manage categories" ON ticket_categories;

-- Create new simplified policies
CREATE POLICY "allow_read_all_categories" ON ticket_categories
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "allow_staff_manage_categories" ON ticket_categories
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'technician')
    )
  );

-- Ensure RLS is enabled
ALTER TABLE ticket_categories ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT ALL ON ticket_categories TO authenticated;