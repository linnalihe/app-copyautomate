-- Run this in the Supabase SQL editor to set up the submissions table.

CREATE TABLE IF NOT EXISTS submissions (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  email       text        NOT NULL,
  first_name  text        NOT NULL DEFAULT 'anonymous',
  last_name   text        NOT NULL DEFAULT 'anonymous',
  message     text        NOT NULL,
  ip_hash     text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Enable Row Level Security (default-deny on all operations)
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;

-- Authenticated Supabase users (admins) can read all submissions
CREATE POLICY "admins_can_read_submissions"
  ON submissions
  FOR SELECT
  TO authenticated
  USING (true);

-- No INSERT/UPDATE/DELETE policies for public or authenticated users.
-- All writes go through the service-role key in the API route, which bypasses RLS.
