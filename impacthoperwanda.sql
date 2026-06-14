-- Impact Hope Rwanda MIS - Database Schema (Migration Safe)
-- Version 2.6 - Auto Profile Creation & Email Confirmation Fix

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. PROFILES TABLE
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

-- 3. PROGRAMS TABLE
CREATE TABLE IF NOT EXISTS public.programs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT CHECK (status IN ('active', 'inactive', 'completed')) DEFAULT 'active',
  budget DECIMAL(14,2) DEFAULT 0,
  start_date DATE,
  manager_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. BENEFICIARIES TABLE
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

-- 5. TRANSACTIONS TABLE
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

-- 6. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  type TEXT CHECK (type IN ('info', 'success', 'warning', 'error')) DEFAULT 'info',
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. STORAGE SETUP
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- 8. RLS ENABLEMENT
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.beneficiaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 9. CLEAN UP POLICIES (DROP EVERYTHING FIRST)
DO $$ 
BEGIN
    -- Profiles
    DROP POLICY IF EXISTS "Public profiles are viewable by authenticated users." ON public.profiles;
    DROP POLICY IF EXISTS "Users can insert their own profiles." ON public.profiles;
    DROP POLICY IF EXISTS "Users can update their own profiles." ON public.profiles;
    DROP POLICY IF EXISTS "Admins can manage all profiles." ON public.profiles;
    
    -- Programs
    DROP POLICY IF EXISTS "Staff can view programs." ON public.programs;
    DROP POLICY IF EXISTS "Admins/CEOs can manage programs." ON public.programs;
    
    -- Beneficiaries
    DROP POLICY IF EXISTS "Staff can view beneficiaries." ON public.beneficiaries;
    DROP POLICY IF EXISTS "Admins/CEOs can manage beneficiaries." ON public.beneficiaries;
    
    -- Transactions
    DROP POLICY IF EXISTS "Users can view transactions." ON public.transactions;
    DROP POLICY IF EXISTS "Finance can manage transactions." ON public.transactions;
    DROP POLICY IF EXISTS "Finance can insert transactions." ON public.transactions;
    
    -- Notifications
    DROP POLICY IF EXISTS "Staff can view notifications." ON public.notifications;
    DROP POLICY IF EXISTS "System can create notifications." ON public.notifications;
    
    -- Storage
    DROP POLICY IF EXISTS "Avatar images are publicly accessible." ON storage.objects;
    DROP POLICY IF EXISTS "Users can upload their own avatar." ON storage.objects;
END $$;

-- 10. RECREATE POLICIES FRESH
-- Profiles
CREATE POLICY "Public profiles are viewable by authenticated users." ON public.profiles
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert their own profiles." ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profiles." ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can manage all profiles." ON public.profiles
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Programs
CREATE POLICY "Staff can view programs." ON public.programs
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins/CEOs can manage programs." ON public.programs
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'ceo'))
  );

-- Beneficiaries
CREATE POLICY "Staff can view beneficiaries." ON public.beneficiaries
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Staff can insert beneficiaries." ON public.beneficiaries
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Admins/CEOs can manage beneficiaries." ON public.beneficiaries
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'ceo', 'supervisor'))
  );

-- Transactions
CREATE POLICY "Users can view transactions." ON public.transactions
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Finance can insert transactions." ON public.transactions
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'finance', 'ceo'))
  );

CREATE POLICY "Finance can manage transactions." ON public.transactions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'finance', 'ceo'))
  );

-- Notifications
CREATE POLICY "Staff can view notifications." ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications." ON public.notifications
  FOR INSERT WITH CHECK (true);

-- Storage (Avatars)
CREATE POLICY "Avatar images are publicly accessible." ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar." ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');

-- 11. TRIGGERS
CREATE OR REPLACE FUNCTION public.notify_new_beneficiary()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.notifications (user_id, title, content, type)
  SELECT id, 'New Beneficiary Registered', 
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

-- 12. BOOTSTRAP ADMIN
UPDATE public.profiles 
SET role = 'admin' 
WHERE email = 'impactadmin2026@gmail.com';

-- ============================================================
-- 13. AUTO PROFILE CREATION ON NEW USER (handle_new_user)
-- Iyo admin akoze user mushya, profile irakozwe ako kanya
-- nta gusabwa ko user asubiza email confirmation
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, status, avatar_url)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', 'Staff Member'),
    COALESCE(new.raw_user_meta_data->>'role', 'education'),
    'active',
    new.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- 14. CONFIRM EMAILS YA USERS BOSE BATAREMEWE
-- Iyi query ikora email confirmation ku users bose
-- bari pending kugira ngo bashobore kwinjira ako kanya
-- ============================================================

UPDATE auth.users
SET email_confirmed_at = now()
WHERE email_confirmed_at IS NULL;

-- ============================================================
-- 15. UPDATED_AT AUTO-UPDATE TRIGGER
-- Iyo profile ivuguruwe, updated_at irahinduka nyawe
-- ============================================================

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

-- ============================================================
-- 16. ADD MISSING COLUMNS TO EXISTING TABLES (safe migrations)
-- ============================================================

ALTER TABLE public.programs 
  ADD COLUMN IF NOT EXISTS budget DECIMAL(14,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS start_date DATE,
  ADD COLUMN IF NOT EXISTS manager_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Drop and recreate transaction INSERT policy
DROP POLICY IF EXISTS "Finance can insert transactions." ON public.transactions;
CREATE POLICY "Finance can insert transactions." ON public.transactions
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'finance', 'ceo'))
  );

-- Drop and recreate beneficiary INSERT policy  
DROP POLICY IF EXISTS "Staff can insert beneficiaries." ON public.beneficiaries;
CREATE POLICY "Staff can insert beneficiaries." ON public.beneficiaries
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
