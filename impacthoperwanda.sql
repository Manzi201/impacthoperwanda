-- ============================================================
-- Impact Hope Rwanda MIS - Complete Database Setup
-- Version 3.0 - Full Schema + RLS + Triggers + Admin Account
-- Run this ONCE in Supabase SQL Editor
-- ============================================================

-- ============================================================
-- 1. EXTENSIONS
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 2. CREATE TABLES (safe - IF NOT EXISTS)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role TEXT CHECK (role IN ('admin', 'ceo', 'finance', 'supervisor', 'education', 'hr')) DEFAULT 'education',
  status TEXT CHECK (status IN ('active', 'inactive', 'pending')) DEFAULT 'active',
  avatar_url TEXT,
  password_temp TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.programs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT CHECK (status IN ('active', 'inactive', 'completed', 'pending_approval', 'rejected')) DEFAULT 'active',
  budget DECIMAL(14,2) DEFAULT 0,
  start_date DATE,
  end_date DATE,
  manager_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  requested_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add missing columns to programs if table already exists
ALTER TABLE public.programs ADD COLUMN IF NOT EXISTS budget DECIMAL(14,2) DEFAULT 0;
ALTER TABLE public.programs ADD COLUMN IF NOT EXISTS start_date DATE;
ALTER TABLE public.programs ADD COLUMN IF NOT EXISTS manager_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.programs ADD COLUMN IF NOT EXISTS end_date DATE;
ALTER TABLE public.programs ADD COLUMN IF NOT EXISTS requested_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Extend status check to allow new values
ALTER TABLE public.programs DROP CONSTRAINT IF EXISTS programs_status_check;
ALTER TABLE public.programs ADD CONSTRAINT programs_status_check 
  CHECK (status IN ('active', 'inactive', 'completed', 'pending_approval', 'rejected'));

-- Add missing columns to profiles if table already exists
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS password_temp TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());

CREATE TABLE IF NOT EXISTS public.beneficiaries (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT UNIQUE,
  phone TEXT,
  photo_url TEXT,
  program_id UUID REFERENCES public.programs(id) ON DELETE SET NULL,
  status TEXT CHECK (status IN ('active', 'inactive', 'graduated')) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  amount DECIMAL(12,2) NOT NULL,
  type TEXT CHECK (type IN ('income', 'expense')) NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  date DATE DEFAULT CURRENT_DATE,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  type TEXT CHECK (type IN ('info', 'success', 'warning', 'error')) DEFAULT 'info',
  is_read BOOLEAN DEFAULT FALSE,
  program_id UUID REFERENCES public.programs(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================================
-- 3. STORAGE SETUP
-- ============================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 4. ENABLE ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.beneficiaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 5. DROP ALL EXISTING POLICIES (clean slate)
-- ============================================================

DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT policyname, tablename
    FROM pg_policies
    WHERE schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, r.tablename);
  END LOOP;
END $$;

DROP POLICY IF EXISTS "Avatar images are publicly accessible." ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own avatar." ON storage.objects;
DROP POLICY IF EXISTS "avatars_public_read" ON storage.objects;
DROP POLICY IF EXISTS "avatars_auth_insert" ON storage.objects;

-- ============================================================
-- 6. CREATE RLS POLICIES
-- ============================================================

-- PROFILES
CREATE POLICY "profiles_select" ON public.profiles
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Admin ALL policy uses security definer function to avoid recursion
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE POLICY "profiles_admin_all" ON public.profiles
  FOR ALL USING (public.is_admin());

-- PROGRAMS
CREATE POLICY "programs_select" ON public.programs
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "programs_manage" ON public.programs
  FOR ALL USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'ceo', 'supervisor')
  );

-- BENEFICIARIES
CREATE POLICY "beneficiaries_select" ON public.beneficiaries
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "beneficiaries_insert" ON public.beneficiaries
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "beneficiaries_manage" ON public.beneficiaries
  FOR ALL USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'ceo', 'supervisor', 'education')
  );

-- TRANSACTIONS
CREATE POLICY "transactions_select" ON public.transactions
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "transactions_insert" ON public.transactions
  FOR INSERT WITH CHECK (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'finance', 'ceo')
  );

CREATE POLICY "transactions_manage" ON public.transactions
  FOR ALL USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'finance', 'ceo')
  );

-- NOTIFICATIONS
CREATE POLICY "notifications_select" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "notifications_insert" ON public.notifications
  FOR INSERT WITH CHECK (true);

-- STORAGE
CREATE POLICY "avatars_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "avatars_auth_insert" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');

-- ============================================================
-- 7. TRIGGERS
-- ============================================================

-- Auto-create profile when new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', 'Staff Member'),
    COALESCE(new.raw_user_meta_data->>'role', 'education')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Auto-update updated_at on profile changes
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger AS $$
BEGIN
  new.updated_at = timezone('utc'::text, now());
  RETURN new;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_profile_updated ON public.profiles;
CREATE TRIGGER on_profile_updated
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Notify admin/supervisor when new beneficiary is added
CREATE OR REPLACE FUNCTION public.notify_new_beneficiary()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.notifications (user_id, title, content, type)
  SELECT id,
    'New Beneficiary Registered',
    new.first_name || ' ' || new.last_name || ' has been added to the system.',
    'success'
  FROM public.profiles
  WHERE role IN ('admin', 'supervisor');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_beneficiary_added ON public.beneficiaries;
CREATE TRIGGER on_beneficiary_added
  AFTER INSERT ON public.beneficiaries
  FOR EACH ROW EXECUTE FUNCTION public.notify_new_beneficiary();

-- ============================================================
-- 8. CONFIRM ALL EXISTING USERS' EMAILS
-- ============================================================

UPDATE auth.users
SET email_confirmed_at = now()
WHERE email_confirmed_at IS NULL;

-- ============================================================
-- 9. ENSURE MASTER ADMIN PROFILE EXISTS
-- ============================================================

INSERT INTO public.profiles (id, email, full_name, role)
SELECT id, email, 'Master Admin', 'admin'
FROM auth.users
WHERE email = 'impactadmin2026@gmail.com'
ON CONFLICT (id) DO UPDATE SET
  role      = 'admin',
  full_name = 'Master Admin';

-- Set status separately (column may have just been added)
UPDATE public.profiles
SET status = 'active'
WHERE email = 'impactadmin2026@gmail.com';

-- ============================================================
-- 10. VERIFY SETUP
-- ============================================================

SELECT
  t.table_name,
  'EXISTS' AS status
FROM information_schema.tables t
WHERE t.table_schema = 'public'
  AND t.table_name IN ('profiles','programs','beneficiaries','transactions','notifications')
ORDER BY t.table_name;

-- ============================================================
-- HOTFIX: Run this in SQL Editor to fix infinite recursion NOW
-- (without re-running the full schema)
-- ============================================================

-- Drop the recursive policies
DROP POLICY IF EXISTS "profiles_admin_all" ON public.profiles;
DROP POLICY IF EXISTS "programs_manage" ON public.programs;
DROP POLICY IF EXISTS "beneficiaries_manage" ON public.beneficiaries;
DROP POLICY IF EXISTS "transactions_manage" ON public.transactions;
DROP POLICY IF EXISTS "transactions_insert" ON public.transactions;
DROP POLICY IF EXISTS "Admins can manage all profiles." ON public.profiles;
DROP POLICY IF EXISTS "Admins/CEOs can manage programs." ON public.programs;
DROP POLICY IF EXISTS "Admins/CEOs can manage beneficiaries." ON public.beneficiaries;
DROP POLICY IF EXISTS "Finance can manage transactions." ON public.transactions;
DROP POLICY IF EXISTS "Finance can insert transactions." ON public.transactions;

-- Create helper function (SECURITY DEFINER bypasses RLS - no recursion)
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Recreate policies using the function
CREATE POLICY "profiles_admin_all" ON public.profiles
  FOR ALL USING (public.get_my_role() = 'admin');

CREATE POLICY "programs_manage" ON public.programs
  FOR ALL USING (public.get_my_role() IN ('admin', 'ceo', 'supervisor'));

CREATE POLICY "beneficiaries_manage" ON public.beneficiaries
  FOR ALL USING (public.get_my_role() IN ('admin', 'ceo', 'supervisor', 'education'));

CREATE POLICY "transactions_insert" ON public.transactions
  FOR INSERT WITH CHECK (public.get_my_role() IN ('admin', 'finance', 'ceo'));

CREATE POLICY "transactions_manage" ON public.transactions
  FOR ALL USING (public.get_my_role() IN ('admin', 'finance', 'ceo'));

-- ============================================================
-- HOTFIX 2: Fix beneficiaries UPDATE policy for supervisor + 
--           finance notification RLS
-- Run in Supabase SQL Editor
-- ============================================================

-- Allow supervisor to UPDATE beneficiaries (assign programs, change status)
DROP POLICY IF EXISTS "beneficiaries_manage" ON public.beneficiaries;
CREATE POLICY "beneficiaries_manage" ON public.beneficiaries
  FOR ALL USING (
    public.get_my_role() IN ('admin', 'ceo', 'supervisor', 'education')
  );

-- Also allow UPDATE separately to be safe
DROP POLICY IF EXISTS "beneficiaries_update" ON public.beneficiaries;
CREATE POLICY "beneficiaries_update" ON public.beneficiaries
  FOR UPDATE USING (
    public.get_my_role() IN ('admin', 'ceo', 'supervisor', 'education')
  );

-- Allow finance to read programs (to show pending approvals)
DROP POLICY IF EXISTS "programs_select" ON public.programs;
CREATE POLICY "programs_select" ON public.programs
  FOR SELECT USING (auth.role() = 'authenticated');

-- Allow notifications UPDATE (for mark as read)
DROP POLICY IF EXISTS "notifications_update" ON public.notifications;
CREATE POLICY "notifications_update" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- ============================================================
-- HOTFIX 3: Fix beneficiaries status check + programs RLS
-- Run ONLY these lines in Supabase SQL Editor
-- ============================================================

-- 1. Fix beneficiaries status constraint - allow all 3 values
ALTER TABLE public.beneficiaries 
  DROP CONSTRAINT IF EXISTS beneficiaries_status_check;

ALTER TABLE public.beneficiaries 
  ADD CONSTRAINT beneficiaries_status_check 
  CHECK (status IN ('active', 'inactive', 'graduated'));

-- 2. Allow ALL authenticated users to UPDATE beneficiaries status
DROP POLICY IF EXISTS "beneficiaries_update" ON public.beneficiaries;
DROP POLICY IF EXISTS "beneficiaries_manage" ON public.beneficiaries;

CREATE POLICY "beneficiaries_manage" ON public.beneficiaries
  FOR ALL USING (auth.role() = 'authenticated');

-- 3. Allow notifications UPDATE for mark as read
DROP POLICY IF EXISTS "notifications_update" ON public.notifications;
CREATE POLICY "notifications_update" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- 4. Programs: all authenticated can read, manage for supervisor+
DROP POLICY IF EXISTS "programs_select" ON public.programs;
CREATE POLICY "programs_select" ON public.programs
  FOR SELECT USING (auth.role() = 'authenticated');

-- ============================================================
-- HOTFIX 4: Allow Finance to UPDATE programs status (approval)
-- Run in Supabase SQL Editor
-- ============================================================

-- Finance needs to UPDATE programs for approval workflow
DROP POLICY IF EXISTS "programs_manage" ON public.programs;
DROP POLICY IF EXISTS "programs_finance_update" ON public.programs;

-- Finance/Admin can update program status (for approvals)
CREATE POLICY "programs_finance_update" ON public.programs
  FOR UPDATE USING (
    public.get_my_role() IN ('admin', 'ceo', 'supervisor', 'finance')
  );

-- Admin/Supervisor/CEO can insert and delete programs  
CREATE POLICY "programs_manage" ON public.programs
  FOR ALL USING (
    public.get_my_role() IN ('admin', 'ceo', 'supervisor')
  );
