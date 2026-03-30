-- ============================================================================
-- EMERGENCY ALERT SYSTEM - DATABASE SCHEMA
-- ============================================================================

-- Drop existing tables if they exist (for fresh setup)
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS residents CASCADE;
DROP TABLE IF EXISTS alerts CASCADE;

-- ============================================================================
-- USERS TABLE (for admin and regular users)
-- ============================================================================
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  username TEXT,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create policy for all operations (for this demo)
CREATE POLICY "Allow all operations on users" ON users
  FOR ALL USING (true);

-- ============================================================================
-- RESIDENTS TABLE
-- ============================================================================
CREATE TABLE residents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  address TEXT NOT NULL,
  contact_number TEXT NOT NULL,
  zone TEXT,
  status TEXT NOT NULL DEFAULT 'no_response' CHECK (status IN ('safe', 'needs_help', 'no_response')),
  last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE residents ENABLE ROW LEVEL SECURITY;

-- Policy for residents
CREATE POLICY "Allow all operations on residents" ON residents
  FOR ALL USING (true);

-- ============================================================================
-- ALERTS TABLE
-- ============================================================================
CREATE TABLE alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  emergency_type TEXT NOT NULL,
  location TEXT NOT NULL,
  alert_level TEXT NOT NULL CHECK (alert_level IN ('low', 'medium', 'high', 'critical')),
  instructions TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

-- Enable Row Level Security
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;

-- Policy for alerts
CREATE POLICY "Allow all operations on alerts" ON alerts
  FOR ALL USING (true);

-- ============================================================================
-- AUTO-FILL TRIGGER (ensures username and full_name are always set)
-- ============================================================================
CREATE OR REPLACE FUNCTION auto_fill_user_fields()
RETURNS TRIGGER AS $$
BEGIN
  NEW.username := COALESCE(NEW.username, split_part(NEW.email, '@', 1));
  NEW.full_name := COALESCE(NEW.full_name, split_part(NEW.email, '@', 1));
  NEW.role := COALESCE(NEW.role, 'user');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_user_defaults ON users;
CREATE TRIGGER set_user_defaults
  BEFORE INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION auto_fill_user_fields();
