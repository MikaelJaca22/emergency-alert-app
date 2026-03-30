-- Emergency Alert System Database Schema for Supabase

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Users table (extends Supabase auth.users)
create table public.users (
  id uuid references auth.users on delete cascade primary key,
  email text unique not null,
  username text unique not null,
  full_name text not null,
  role text default 'admin',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.users enable row level security;

-- Users policies
create policy "Users can view own profile" on public.users
  for select using (auth.uid() = id);
  
create policy "Users can update own profile" on public.users
  for update using (auth.uid() = id);

-- Residents table
create table public.residents (
  id uuid default uuid_generate_v4() primary key,
  full_name text not null,
  address text not null,
  contact_number text not null,
  zone text,
  status text default 'no_response' check (status in ('safe', 'needs_help', 'no_response')),
  last_updated timestamp with time zone default timezone('utc'::text, now()) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.residents enable row level security;

-- Residents policies (admins can manage all residents)
create policy "Authenticated users can view residents" on public.residents
  for select to authenticated using (true);

create policy "Authenticated users can insert residents" on public.residents
  for insert to authenticated with check (true);

create policy "Authenticated users can update residents" on public.residents
  for update to authenticated using (true);

create policy "Authenticated users can delete residents" on public.residents
  for delete to authenticated using (true);

-- Alerts table
create table public.alerts (
  id uuid default uuid_generate_v4() primary key,
  emergency_type text not null,
  location text not null,
  alert_level text not null check (alert_level in ('low', 'medium', 'high', 'critical')),
  instructions text not null,
  status text default 'active' check (status in ('active', 'resolved', 'cancelled')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  resolved_at timestamp with time zone,
  created_by uuid references public.users(id)
);

-- Enable RLS
alter table public.alerts enable row level security;

-- Alerts policies (admins can manage all alerts)
create policy "Authenticated users can view alerts" on public.alerts
  for select to authenticated using (true);

create policy "Authenticated users can insert alerts" on public.alerts
  for insert to authenticated with check (true);

create policy "Authenticated users can update alerts" on public.alerts
  for update to authenticated using (true);

-- SMS Logs table (for tracking sent messages)
create table public.sms_logs (
  id uuid default uuid_generate_v4() primary key,
  alert_id uuid references public.alerts(id) on delete cascade,
  resident_id uuid references public.residents(id) on delete set null,
  phone_number text not null,
  message text not null,
  status text default 'sent' check (status in ('sent', 'delivered', 'failed')),
  sent_at timestamp with time zone default timezone('utc'::text, now()) not null,
  response text,
  response_at timestamp with time zone
);

-- Enable RLS
alter table public.sms_logs enable row level security;

-- SMS Logs policies
create policy "Authenticated users can view SMS logs" on public.sms_logs
  for select to authenticated using (true);

create policy "Authenticated users can insert SMS logs" on public.sms_logs
  for insert to authenticated with check (true);

-- Create indexes for better performance
create index idx_residents_status on public.residents(status);
create index idx_residents_zone on public.residents(zone);
create index idx_alerts_status on public.alerts(status);
create index idx_alerts_created_at on public.alerts(created_at desc);
create index idx_sms_logs_alert_id on public.sms_logs(alert_id);
create index idx_sms_logs_resident_id on public.sms_logs(resident_id);

-- Create updated_at trigger function
create or replace function public.update_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

-- Create triggers for updated_at
create trigger update_users_updated_at
  before update on public.users
  for each row execute function public.update_updated_at();

create trigger update_residents_updated_at
  before update on public.residents
  for each row execute function public.update_updated_at();

-- Function to handle new user registration
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, username, full_name)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'username',
    new.raw_user_meta_data->>'full_name'
  );
  return new;
end;
$$ language plpgsql security definer;

-- Trigger for new user registration
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
