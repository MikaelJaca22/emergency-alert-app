export interface User {
  id: string;
  email: string;
  username: string;
  full_name: string;
  contact_number?: string;
  address?: string;
  role?: string;
}

export interface Resident {
  id: string;
  full_name: string;
  address: string;
  contact_number: string;
  zone?: string;
  status: 'safe' | 'needs_help' | 'no_response';
  last_updated: string;
  created_at: string;
}

export interface Alert {
  id: string;
  emergency_type: string;
  location: string;
  alert_level: 'low' | 'medium' | 'high' | 'critical';
  instructions: string;
  status: 'active' | 'resolved' | 'cancelled';
  created_at: string;
  resolved_at?: string;
}

export interface ResidentStats {
  total: number;
  safe: number;
  needs_help: number;
  no_response: number;
}

export interface AuthResponse {
  user: User;
  access_token: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  username: string;
  full_name: string;
  role?: 'admin' | 'user';
  contact_number?: string;
  address?: string;
}

export interface CreateResidentData {
  full_name: string;
  address: string;
  contact_number: string;
  zone?: string;
}

export interface CreateAlertData {
  emergency_type: string;
  location: string;
  alert_level: 'low' | 'medium' | 'high' | 'critical';
  instructions: string;
}

export type EmergencyType = 
  | 'Fire'
  | 'Flood'
  | 'Earthquake'
  | 'Typhoon'
  | 'Landslide'
  | 'Medical Emergency'
  | 'Security Threat'
  | 'Other';

export type AlertLevel = 'low' | 'medium' | 'high' | 'critical';

export const EMERGENCY_TYPES: EmergencyType[] = [
  'Fire',
  'Flood',
  'Earthquake',
  'Typhoon',
  'Landslide',
  'Medical Emergency',
  'Security Threat',
  'Other',
];

export const ALERT_LEVELS: AlertLevel[] = ['low', 'medium', 'high', 'critical'];

export type LogLevel = 'info' | 'warning' | 'error';

export type ActionType = 
  | 'login'
  | 'logout'
  | 'register'
  | 'alert_create'
  | 'alert_resolve'
  | 'alert_cancel'
  | 'alert_bulk_resolve'
  | 'alert_bulk_cancel'
  | 'resident_create'
  | 'resident_update'
  | 'resident_delete'
  | 'resident_status_update'
  | 'system_reset'
  | 'sms_sent'
  | 'sms_failed';

export interface SystemLog {
  id: string;
  action: ActionType;
  level: LogLevel;
  description: string;
  admin_id?: string;
  admin_email?: string;
  entity_type?: string;
  entity_id?: string;
  metadata?: string;
  created_at: string;
}

export interface LogFilter {
  action?: ActionType;
  level?: LogLevel;
  admin_id?: string;
  start_date?: string;
  end_date?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface LogStats {
  total: number;
  today: number;
  byLevel: Record<string, number>;
  byAction: Record<string, number>;
}
