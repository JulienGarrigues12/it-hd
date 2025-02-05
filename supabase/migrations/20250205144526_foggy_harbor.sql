/*
  # Add password hash storage

  1. Changes
    - Add password_hash column to users table
    - Add function to hash passwords using pgcrypto
    - Add function to verify passwords
  
  2. Security
    - Uses pgcrypto for secure password hashing
    - Implements password verification in database
*/

-- Enable pgcrypto extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Add password_hash column
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS password_hash text;

-- Create function to hash passwords
CREATE OR REPLACE FUNCTION hash_password(password text)
RETURNS text AS $$
BEGIN
  RETURN crypt(password, gen_salt('bf', 8));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to verify passwords
CREATE OR REPLACE FUNCTION verify_password(password text, hash text)
RETURNS boolean AS $$
BEGIN
  RETURN hash = crypt(password, hash);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;