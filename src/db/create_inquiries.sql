-- Create inquiries table for storing contact form submissions
-- Run this in your Supabase SQL editor or psql connected to the project's DB

-- If your database supports gen_random_uuid(), use that; otherwise use uuid_generate_v4().
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS public.inquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  email text NOT NULL,
  subject text,
  message text NOT NULL,
  responded boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
