-- =====================================================
-- AddictionTracker Database Migration
-- Run this in your Supabase SQL Editor
-- =====================================================

-- 1. Create the addictions table
CREATE TABLE IF NOT EXISTS public.addictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Create the logs table
CREATE TABLE IF NOT EXISTS public.logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  addiction_id UUID NOT NULL REFERENCES public.addictions(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('clean', 'relapse', 'partial')),
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_addictions_user_id ON public.addictions(user_id);
CREATE INDEX IF NOT EXISTS idx_logs_user_id ON public.logs(user_id);
CREATE INDEX IF NOT EXISTS idx_logs_addiction_id ON public.logs(addiction_id);
CREATE INDEX IF NOT EXISTS idx_logs_date ON public.logs(date);
CREATE UNIQUE INDEX IF NOT EXISTS idx_logs_unique_entry ON public.logs(user_id, addiction_id, date);

-- 4. Enable Row Level Security
ALTER TABLE public.addictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logs ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for addictions table

-- SELECT: Users can only read their own addictions
CREATE POLICY "Users can view own addictions"
  ON public.addictions
  FOR SELECT
  USING (auth.uid() = user_id);

-- INSERT: Users can only insert addictions for themselves
CREATE POLICY "Users can insert own addictions"
  ON public.addictions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- UPDATE: Users can only update their own addictions
CREATE POLICY "Users can update own addictions"
  ON public.addictions
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- DELETE: Users can only delete their own addictions
CREATE POLICY "Users can delete own addictions"
  ON public.addictions
  FOR DELETE
  USING (auth.uid() = user_id);

-- 6. RLS Policies for logs table

-- SELECT: Users can only read their own logs
CREATE POLICY "Users can view own logs"
  ON public.logs
  FOR SELECT
  USING (auth.uid() = user_id);

-- INSERT: Users can only insert logs for themselves
CREATE POLICY "Users can insert own logs"
  ON public.logs
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- UPDATE: Users can only update their own logs
CREATE POLICY "Users can update own logs"
  ON public.logs
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- DELETE: Users can only delete their own logs
CREATE POLICY "Users can delete own logs"
  ON public.logs
  FOR DELETE
  USING (auth.uid() = user_id);
