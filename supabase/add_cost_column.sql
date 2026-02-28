-- Run this in your Supabase SQL Editor to add the cost column
ALTER TABLE public.logs ADD COLUMN IF NOT EXISTS cost DECIMAL(10,2) DEFAULT 0;
