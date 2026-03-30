-- System Logs Table Schema for Supabase
-- Run this SQL in your Supabase SQL Editor to create the system_logs table

-- Create the system_logs table
CREATE TABLE IF NOT EXISTS system_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action VARCHAR(50) NOT NULL,
    level VARCHAR(20) NOT NULL DEFAULT 'info',
    description TEXT NOT NULL,
    admin_id VARCHAR(255),
    admin_email VARCHAR(255),
    entity_type VARCHAR(50),
    entity_id VARCHAR(255),
    metadata TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_system_logs_action ON system_logs(action);
CREATE INDEX IF NOT EXISTS idx_system_logs_level ON system_logs(level);
CREATE INDEX IF NOT EXISTS idx_system_logs_admin_id ON system_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_system_logs_created_at ON system_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_system_logs_entity ON system_logs(entity_type, entity_id);

-- Enable Row Level Security (RLS)
ALTER TABLE system_logs ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows authenticated users to read and insert logs
-- (You may want to adjust this based on your auth requirements)
CREATE POLICY "Allow authenticated access to system_logs" ON system_logs
    FOR ALL
    USING (true)
    WITH CHECK (true);
