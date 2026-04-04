-- ============================================================================
-- EMERGENCY ALERT SYSTEM - COMPLETE DATABASE SCHEMA (SYNCED WITH BACKEND)
-- ============================================================================
-- Run this entire script in your Supabase SQL Editor
-- This schema is synced with the backend server.js API endpoints
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- USERS TABLE (for admin and regular users)
-- ============================================================================
DROP TABLE IF EXISTS users CASCADE;
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

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations on users" ON users FOR ALL USING (true);

-- Auto-fill trigger for users
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
DROP TABLE IF EXISTS residents CASCADE;
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

ALTER TABLE residents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations on residents" ON residents FOR ALL USING (true);

-- Auto-update trigger for residents timestamp
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

-- Create indexes for residents
CREATE INDEX IF NOT EXISTS idx_residents_status ON residents(status);
CREATE INDEX IF NOT EXISTS idx_residents_user_id ON residents(user_id);
CREATE INDEX IF NOT EXISTS idx_residents_created_at ON residents(created_at DESC);

-- ============================================================================
-- ALERTS TABLE (created by admin to notify residents via SMS)
-- ============================================================================
DROP TABLE IF EXISTS alerts CASCADE;
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

ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations on alerts" ON alerts FOR ALL USING (true);

-- Create indexes for alerts
CREATE INDEX IF NOT EXISTS idx_alerts_status ON alerts(status);
CREATE INDEX IF NOT EXISTS idx_alerts_created_at ON alerts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_level ON alerts(alert_level);

-- ============================================================================
-- EMERGENCY REPORTS TABLE (submitted by residents)
-- ============================================================================
DROP TABLE IF EXISTS emergency_reports CASCADE;
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

ALTER TABLE emergency_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations on emergency_reports" ON emergency_reports FOR ALL USING (true);

-- Auto-update trigger for emergency reports timestamp
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

-- Create indexes for emergency reports
CREATE INDEX IF NOT EXISTS idx_emergency_reports_user_id ON emergency_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_emergency_reports_status ON emergency_reports(status);
CREATE INDEX IF NOT EXISTS idx_emergency_reports_created_at ON emergency_reports(created_at DESC);

-- ============================================================================
-- SYSTEM LOGS TABLE (for tracking admin actions and system events)
-- ============================================================================
DROP TABLE IF EXISTS system_logs CASCADE;
CREATE TABLE system_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action VARCHAR(50) NOT NULL,
  level VARCHAR(20) NOT NULL DEFAULT 'info',
  description TEXT NOT NULL,
  admin_id UUID,
  admin_email VARCHAR(255),
  entity_type VARCHAR(50),
  entity_id VARCHAR(255),
  metadata TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for system logs
CREATE INDEX IF NOT EXISTS idx_system_logs_action ON system_logs(action);
CREATE INDEX IF NOT EXISTS idx_system_logs_level ON system_logs(level);
CREATE INDEX IF NOT EXISTS idx_system_logs_admin_id ON system_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_system_logs_created_at ON system_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_system_logs_entity ON system_logs(entity_type, entity_id);

ALTER TABLE system_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations on system_logs" ON system_logs FOR ALL USING (true);

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
    COUNT(*)::BIGINT as total,
    COUNT(*) FILTER (WHERE status = 'safe')::BIGINT as safe,
    COUNT(*) FILTER (WHERE status = 'needs_help')::BIGINT as needs_help,
    COUNT(*) FILTER (WHERE status = 'no_response')::BIGINT as no_response
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
-- VERIFY SETUP
-- ============================================================================
SELECT 'Database schema synced successfully!' as message;

-- List all tables
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;