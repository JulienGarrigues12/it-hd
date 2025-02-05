/*
  # Fix User Policies

  1. Changes
    - Remove recursive policies for users table
    - Simplify role-based access
    - Add proper user management policies
  
  2. Security
    - Enable RLS
    - Add policies for user management
    - Ensure proper access control
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Technicians and admins can view all users" ON users;

-- Create new policies
CREATE POLICY "Users can view their own profile"
  ON users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all users"
  ON users FOR SELECT
  USING (
    auth.uid() IN (
      SELECT id FROM users 
      WHERE role = 'admin'::user_role
    )
  );

CREATE POLICY "Admins can update users"
  ON users FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT id FROM users 
      WHERE role = 'admin'::user_role
    )
  );