/*
  # Initial Schema Setup for Ticketing System

  1. New Tables
    - users (extends Supabase auth.users)
      - role (enum: user, technician, admin)
      - full_name (text)
      - department (text)
    - tickets
      - id (uuid)
      - title (text)
      - description (text)
      - type (enum: incident, request)
      - priority (enum: critical, high, medium, low)
      - status (enum: open, in_progress, resolved, closed)
      - created_by (uuid, references users)
      - assigned_to (uuid, references users)
      - created_at (timestamp)
      - updated_at (timestamp)
    - ticket_categories
      - id (uuid)
      - name (text)
      - description (text)
      - is_active (boolean)
    - ticket_comments
      - id (uuid)
      - ticket_id (uuid, references tickets)
      - user_id (uuid, references users)
      - content (text)
      - created_at (timestamp)
    - ticket_attachments
      - id (uuid)
      - ticket_id (uuid, references tickets)
      - file_name (text)
      - file_path (text)
      - uploaded_by (uuid, references users)
      - created_at (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for different user roles
*/

-- Create ENUMs
CREATE TYPE user_role AS ENUM ('user', 'technician', 'admin');
CREATE TYPE ticket_type AS ENUM ('incident', 'request');
CREATE TYPE ticket_priority AS ENUM ('critical', 'high', 'medium', 'low');
CREATE TYPE ticket_status AS ENUM ('open', 'in_progress', 'resolved', 'closed');

-- Create Users Profile Table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY REFERENCES auth.users(id),
  role user_role DEFAULT 'user',
  full_name text,
  department text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create Ticket Categories Table
CREATE TABLE IF NOT EXISTS ticket_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create Tickets Table
CREATE TABLE IF NOT EXISTS tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  type ticket_type NOT NULL,
  category_id uuid REFERENCES ticket_categories(id),
  priority ticket_priority NOT NULL DEFAULT 'medium',
  status ticket_status NOT NULL DEFAULT 'open',
  created_by uuid REFERENCES users(id) NOT NULL,
  assigned_to uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create Ticket Comments Table
CREATE TABLE IF NOT EXISTS ticket_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid REFERENCES tickets(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES users(id) NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create Ticket Attachments Table
CREATE TABLE IF NOT EXISTS ticket_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid REFERENCES tickets(id) ON DELETE CASCADE NOT NULL,
  file_name text NOT NULL,
  file_path text NOT NULL,
  uploaded_by uuid REFERENCES users(id) NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_attachments ENABLE ROW LEVEL SECURITY;

-- Create Policies

-- Users Policies
CREATE POLICY "Users can view their own profile"
  ON users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Technicians and admins can view all users"
  ON users FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('technician', 'admin')
    )
  );

-- Tickets Policies
CREATE POLICY "Users can view their own tickets"
  ON tickets FOR SELECT
  USING (created_by = auth.uid());

CREATE POLICY "Users can create tickets"
  ON tickets FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Technicians and admins can view all tickets"
  ON tickets FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('technician', 'admin')
    )
  );

CREATE POLICY "Technicians can update assigned tickets"
  ON tickets FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role = 'technician'
      AND (tickets.assigned_to = auth.uid() OR tickets.assigned_to IS NULL)
    )
  );

CREATE POLICY "Admins can update all tickets"
  ON tickets FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- Comments Policies
CREATE POLICY "Users can view comments on their tickets"
  ON ticket_comments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM tickets
      WHERE tickets.id = ticket_comments.ticket_id
      AND tickets.created_by = auth.uid()
    )
  );

CREATE POLICY "Users can add comments to their tickets"
  ON ticket_comments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tickets
      WHERE tickets.id = ticket_id
      AND tickets.created_by = auth.uid()
    )
  );

CREATE POLICY "Technicians and admins can view all comments"
  ON ticket_comments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('technician', 'admin')
    )
  );

-- Categories Policies
CREATE POLICY "All authenticated users can view active categories"
  ON ticket_categories FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage categories"
  ON ticket_categories FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- Attachments Policies
CREATE POLICY "Users can view attachments on their tickets"
  ON ticket_attachments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM tickets
      WHERE tickets.id = ticket_id
      AND tickets.created_by = auth.uid()
    )
  );

CREATE POLICY "Users can add attachments to their tickets"
  ON ticket_attachments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tickets
      WHERE tickets.id = ticket_id
      AND tickets.created_by = auth.uid()
    )
  );

CREATE POLICY "Technicians and admins can view all attachments"
  ON ticket_attachments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('technician', 'admin')
    )
  );