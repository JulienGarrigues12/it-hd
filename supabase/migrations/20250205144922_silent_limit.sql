/*
  # Add Computer Inventory Management

  1. New Tables
    - `computer_assets`
      - Basic computer information
      - Status tracking
      - Assignment details
    - `computer_maintenance`
      - Maintenance history
      - Service records
    - `computer_software`
      - Installed software tracking
      - License management

  2. Security
    - Enable RLS on all new tables
    - Add policies for technicians and admins
*/

-- Create computer status enum
CREATE TYPE computer_status AS ENUM (
  'active', 'maintenance', 'retired', 'storage'
);

-- Create computer type enum
CREATE TYPE computer_type AS ENUM (
  'desktop', 'laptop', 'workstation', 'server'
);

-- Create Computer Assets Table
CREATE TABLE computer_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_tag text UNIQUE NOT NULL,
  serial_number text UNIQUE,
  name text NOT NULL,
  type computer_type NOT NULL,
  manufacturer text NOT NULL,
  model text NOT NULL,
  status computer_status DEFAULT 'active',
  purchase_date date,
  warranty_expiry date,
  assigned_to uuid REFERENCES users(id),
  assigned_date timestamptz,
  location text,
  department text,
  specifications jsonb,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create Computer Maintenance Table
CREATE TABLE computer_maintenance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  computer_id uuid REFERENCES computer_assets(id) ON DELETE CASCADE,
  maintenance_type text NOT NULL,
  description text NOT NULL,
  performed_by uuid REFERENCES users(id),
  performed_at timestamptz NOT NULL DEFAULT now(),
  cost decimal(10,2),
  next_maintenance_date date,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Create Computer Software Table
CREATE TABLE computer_software (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  computer_id uuid REFERENCES computer_assets(id) ON DELETE CASCADE,
  software_name text NOT NULL,
  version text,
  license_key text,
  installation_date date,
  expiry_date date,
  status text DEFAULT 'active',
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE computer_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE computer_maintenance ENABLE ROW LEVEL SECURITY;
ALTER TABLE computer_software ENABLE ROW LEVEL SECURITY;

-- Create Policies

-- Computer Assets Policies
CREATE POLICY "Users can view their assigned computers"
  ON computer_assets
  FOR SELECT
  USING (assigned_to = auth.uid());

CREATE POLICY "Technicians can view all computers"
  ON computer_assets
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('technician', 'admin')
    )
  );

CREATE POLICY "Technicians can manage computers"
  ON computer_assets
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('technician', 'admin')
    )
  );

-- Maintenance Policies
CREATE POLICY "Users can view maintenance of their computers"
  ON computer_maintenance
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM computer_assets
      WHERE computer_assets.id = computer_id
      AND computer_assets.assigned_to = auth.uid()
    )
  );

CREATE POLICY "Technicians can manage maintenance"
  ON computer_maintenance
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('technician', 'admin')
    )
  );

-- Software Policies
CREATE POLICY "Users can view software on their computers"
  ON computer_software
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM computer_assets
      WHERE computer_assets.id = computer_id
      AND computer_assets.assigned_to = auth.uid()
    )
  );

CREATE POLICY "Technicians can manage software"
  ON computer_software
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('technician', 'admin')
    )
  );

-- Create indexes for better performance
CREATE INDEX idx_computer_assets_assigned_to ON computer_assets(assigned_to);
CREATE INDEX idx_computer_assets_status ON computer_assets(status);
CREATE INDEX idx_computer_maintenance_computer_id ON computer_maintenance(computer_id);
CREATE INDEX idx_computer_software_computer_id ON computer_software(computer_id);