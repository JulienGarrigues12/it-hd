/*
  # Add computer assignment history tracking

  1. New Tables
    - `computer_assignment_history`
      - `id` (uuid, primary key)
      - `computer_id` (uuid, references computer_assets)
      - `user_id` (uuid, references users)
      - `assigned_by` (uuid, references users)
      - `assigned_at` (timestamptz)
      - `unassigned_at` (timestamptz)
      - `notes` (text)

  2. Security
    - Enable RLS on `computer_assignment_history` table
    - Add policies for technicians and admins to manage history
    - Add policies for users to view history of their assigned computers
*/

-- Create computer assignment history table
CREATE TABLE IF NOT EXISTS computer_assignment_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  computer_id uuid REFERENCES computer_assets(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id),
  assigned_by uuid REFERENCES users(id),
  assigned_at timestamptz NOT NULL DEFAULT now(),
  unassigned_at timestamptz,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_computer_assignment_history_computer_id 
ON computer_assignment_history(computer_id);

CREATE INDEX IF NOT EXISTS idx_computer_assignment_history_user_id 
ON computer_assignment_history(user_id);

-- Enable RLS
ALTER TABLE computer_assignment_history ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Technicians and admins can manage assignment history"
  ON computer_assignment_history
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('technician', 'admin')
    )
  );

CREATE POLICY "Users can view assignment history of their computers"
  ON computer_assignment_history
  FOR SELECT
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM computer_assets
      WHERE computer_assets.id = computer_id
      AND computer_assets.assigned_to = auth.uid()
    )
  );