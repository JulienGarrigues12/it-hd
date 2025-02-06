-- Add ticket_type column to ticket_categories
ALTER TABLE ticket_categories 
ADD COLUMN ticket_type ticket_type NOT NULL DEFAULT 'incident';

-- Update existing categories to have a valid type
UPDATE ticket_categories SET ticket_type = 'incident' WHERE ticket_type IS NULL;