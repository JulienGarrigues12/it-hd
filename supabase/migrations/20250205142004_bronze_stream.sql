/*
  # Add requestor field to tickets table

  1. Changes
    - Add `requestor_id` column to tickets table
    - Add foreign key constraint to users table
    - Set default value to created_by for backward compatibility
  
  2. Security
    - No changes to RLS policies needed as they are currently disabled
*/

-- Add requestor_id column
ALTER TABLE tickets 
ADD COLUMN IF NOT EXISTS requestor_id uuid REFERENCES users(id);

-- Set default value for existing tickets
UPDATE tickets 
SET requestor_id = created_by 
WHERE requestor_id IS NULL;

-- Make requestor_id NOT NULL after setting defaults
ALTER TABLE tickets 
ALTER COLUMN requestor_id SET NOT NULL;

-- Add an index for better query performance
CREATE INDEX IF NOT EXISTS idx_tickets_requestor_id 
ON tickets(requestor_id);