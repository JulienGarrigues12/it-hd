/*
  # Disable Row Level Security

  1. Changes
    - Disable RLS on all tables to allow unrestricted access
    - Keep existing tables and data intact
    - No destructive changes
*/

-- Disable RLS on all tables
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE tickets DISABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_comments DISABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_attachments DISABLE ROW LEVEL SECURITY;