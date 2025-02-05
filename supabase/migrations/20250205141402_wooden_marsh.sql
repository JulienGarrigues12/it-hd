/*
  # Add email field to users table

  1. Changes
    - Add email column to users table
    - Make email column NOT NULL
    - Add UNIQUE constraint to email column
*/

ALTER TABLE users ADD COLUMN IF NOT EXISTS email text NOT NULL;
ALTER TABLE users ADD CONSTRAINT users_email_key UNIQUE (email);