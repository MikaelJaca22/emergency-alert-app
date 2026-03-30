import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../shared/supabase/supabase.service';
import { InfobipService } from './infobip.service';
import { ResidentsService } from '../residents/residents.service';

export interface Alert {
  id?: string;
  emergency_type: string;
  location: string;
  alert_level: 'low' | 'medium' | 'high' | 'critical';
  instructions: string;
  status: 'active' | 'resolved' | 'cancelled';
  created_at?: string;
  resolved_at?: string;
}

export interface CreateAlertDto {
  emergency_type: string;
  location: string;
  alert_level: 'low' | 'medium' | 'high' | 'critical';
  instructions: string;
}

@Injectable()
export class AlertsService {
  constructor(
    private supabaseService: SupabaseService,
    private infobipService: InfobipService,
    private residentsService: ResidentsService,
  ) {}

  async findAll(token: string): Promise<Alert[]> {
    const supabase = this.supabaseService.getAuthClient(token);
    
    const { data, error } = await supabase
      .from('alerts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch alerts: ${error.message}`);
    }

    return data || [];
  }

  async findOne(id: string, token: string): Promise<Alert> {
    const supabase = this.supabaseService.getAuthClient(token);
    
    const { data, error } = await supabase
      .from('alerts')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      throw new Error('Alert not found');
    }

    return data;
  }

  async create(dto: CreateAlertDto, token: string): Promise<Alert> {
    const supabase = this.supabaseService.getAuthClient(token);
    
    // Create the alert
    const { data, error } = await supabase
      .from('alerts')
      .insert({
        ...dto,
        status: 'active',
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create alert: ${error.message}`);
    }

    // Send SMS to all residents
    try {
      const residents = await this.residentsService.findAll(token);
      const phoneNumbers = residents.map(r => r.contact_number).filter(Boolean);
      
      if (phoneNumbers.length > 0) {
        const message = this.formatAlertMessage(dto);
        await this.infobipService.sendBulkSMS(phoneNumbers, message);
      }
    } catch (smsError) {
      console.error('Failed to send SMS:', smsError);
    }

    return data;
  }

  async resolve(id: string, token: string): Promise<Alert> {
    const supabase = this.supabaseService.getAuthClient(token);
    
    const { data, error } = await supabase
      .from('alerts')
      .update({
        status: 'resolved',
        resolved_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to resolve alert: ${error.message}`);
    }

    return data;
  }

  async cancel(id: string, token: string): Promise<Alert> {
    const supabase = this.supabaseService.getAuthClient(token);
    
    const { data, error } = await supabase
      .from('alerts')
      .update({
        status: 'cancelled',
        resolved_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to cancel alert: ${error.message}`);
    }

    return data;
  }

  async getActiveAlerts(token: string): Promise<Alert[]> {
    const supabase = this.supabaseService.getAuthClient(token);
    
    const { data, error } = await supabase
      .from('alerts')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch active alerts: ${error.message}`);
    }

    return data || [];
  }

  async resetSystem(token: string): Promise<void> {
    const supabase = this.supabaseService.getAuthClient(token);
    
    // Cancel all active alerts
    await supabase
      .from('alerts')
      .update({ status: 'cancelled', resolved_at: new Date().toISOString() })
      .eq('status', 'active');

    // Reset all resident statuses
    await this.residentsService.resetAllStatus(token);
  }

  private formatAlertMessage(alert: CreateAlertDto): string {
    const levelEmoji = {
      low: '⚠️',
      medium: '🔶',
      high: '🔴',
      critical: '🚨',
    };

    return `${levelEmoji[alert.alert_level]} EMERGENCY ALERT: ${alert.emergency_type.toUpperCase()} at ${alert.location}. Level: ${alert.alert_level.toUpperCase()}. ${alert.instructions}. Reply with HELP if you need assistance or SAFE if you are safe.`;
  }
}
