-- ============================================================================
-- EMERGENCY ALERT SYSTEM - DATABASE SCHEMA
-- ============================================================================
-- Run this entire script in your Supabase SQL Editor
-- This schema matches the current system where:
-- - Users register and are auto-created as residents
-- - Admins monitor residents and send SMS alerts
-- - Residents can report emergencies
-- ============================================================================

-- Drop existing tables if they exist (for fresh setup)
DROP TABLE IF EXISTS emergency_reports CASCADE;
DROP TABLE IF EXISTS alerts CASCADE;
DROP TABLE IF EXISTS residents CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ============================================================================
-- USERS TABLE (for admin and regular users)
-- ============================================================================
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  username TEXT,
  full_name TEXT,
  contact_number TEXT DEFAULT '',
  address TEXT DEFAULT '',
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations on users" ON users FOR ALL USING (true);

-- ============================================================================
-- AUTO-FILL TRIGGER FOR USERS
-- Ensures username, full_name, and updated_at are always set
-- ============================================================================
CREATE OR REPLACE FUNCTION auto_fill_user_fields()
RETURNS TRIGGER AS $$
BEGIN
  NEW.username := COALESCE(NEW.username, split_part(NEW.email, '@', 1));
  NEW.full_name := COALESCE(NEW.full_name, split_part(NEW.email, '@', 1));
  NEW.role := COALESCE(NEW.role, 'user');
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_user_defaults ON users;
CREATE TRIGGER set_user_defaults
  BEFORE INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION auto_fill_user_fields();

-- ============================================================================
-- RESIDENTS TABLE (auto-created when users register)
-- ============================================================================
CREATE TABLE residents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  contact_number TEXT DEFAULT '',
  address TEXT DEFAULT '',
  zone TEXT,
  status TEXT NOT NULL DEFAULT 'no_response' CHECK (status IN ('safe', 'needs_help', 'no_response')),
  last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE residents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations on residents" ON residents FOR ALL USING (true);

-- ============================================================================
-- AUTO-UPDATE TRIGGER FOR RESIDENTS
-- Updates the last_updated timestamp when status changes
-- ============================================================================
CREATE OR REPLACE FUNCTION update_resident_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_updated := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_resident_timestamp ON residents;
CREATE TRIGGER set_resident_timestamp
  BEFORE UPDATE ON residents
  FOR EACH ROW
  EXECUTE FUNCTION update_resident_timestamp();

-- ============================================================================
-- ALERTS TABLE (created by admin to notify residents via SMS)
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
CREATE POLICY "Allow all operations on alerts" ON alerts FOR ALL USING (true);

-- ============================================================================
-- EMERGENCY REPORTS TABLE (submitted by residents)
-- ============================================================================
CREATE TABLE emergency_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  emergency_type TEXT NOT NULL,
  description TEXT,
  location TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'acknowledged', 'resolved')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE emergency_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations on emergency_reports" ON emergency_reports FOR ALL USING (true);

-- ============================================================================
-- AUTO-UPDATE TRIGGER FOR EMERGENCY REPORTS
-- ============================================================================
CREATE OR REPLACE FUNCTION update_emergency_report_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_emergency_report_timestamp ON emergency_reports;
CREATE TRIGGER set_emergency_report_timestamp
  BEFORE UPDATE ON emergency_reports
  FOR EACH ROW
  EXECUTE FUNCTION update_emergency_report_timestamp();

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to get resident stats (used by dashboard)
CREATE OR REPLACE FUNCTION get_resident_stats()
RETURNS TABLE (
  total BIGINT,
  safe BIGINT,
  needs_help BIGINT,
  no_response BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE status = 'safe') as safe,
    COUNT(*) FILTER (WHERE status = 'needs_help') as needs_help,
    COUNT(*) FILTER (WHERE status = 'no_response') as no_response
  FROM residents;
END;
$$ LANGUAGE plpgsql;

-- Function to reset all resident statuses (used by admin reset system)
CREATE OR REPLACE FUNCTION reset_all_resident_statuses()
RETURNS void AS $$
BEGIN
  UPDATE residents SET status = 'no_response', last_updated = NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to cancel all active alerts (used by admin reset system)
CREATE OR REPLACE FUNCTION cancel_all_active_alerts()
RETURNS void AS $$
BEGIN
  UPDATE alerts SET status = 'cancelled', resolved_at = NOW() WHERE status = 'active';
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- SCHEMA SETUP COMPLETE
-- ============================================================================
-- Tables created:
-- - users: Stores both admin and regular user accounts
-- - residents: Auto-created from users, stores resident info and status
-- - alerts: Emergency alerts created by admin
-- - emergency_reports: Emergency reports submitted by residents
--
-- Triggers created:
-- - Auto-fill user fields on insert
-- - Auto-update timestamps on update
--
-- Functions created:
-- - get_resident_stats(): Returns resident status counts
-- - reset_all_resident_statuses(): Resets all residents to no_response
-- - cancel_all_active_alerts(): Cancels all active alerts
-- ============================================================================
