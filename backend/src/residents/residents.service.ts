import { Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../shared/supabase/supabase.service';

export interface Resident {
  id?: string;
  full_name: string;
  address: string;
  contact_number: string;
  zone?: string;
  status?: 'safe' | 'needs_help' | 'no_response';
  last_updated?: string;
}

export interface CreateResidentDto {
  full_name: string;
  address: string;
  contact_number: string;
  zone?: string;
}

export interface UpdateResidentDto {
  full_name?: string;
  address?: string;
  contact_number?: string;
  zone?: string;
  status?: 'safe' | 'needs_help' | 'no_response';
}

@Injectable()
export class ResidentsService {
  constructor(private supabaseService: SupabaseService) {}

  async findAll(token: string): Promise<Resident[]> {
    const supabase = this.supabaseService.getAuthClient(token);
    
    const { data, error } = await supabase
      .from('residents')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch residents: ${error.message}`);
    }

    return data || [];
  }

  async findOne(id: string, token: string): Promise<Resident> {
    const supabase = this.supabaseService.getAuthClient(token);
    
    const { data, error } = await supabase
      .from('residents')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      throw new NotFoundException('Resident not found');
    }

    return data;
  }

  async create(dto: CreateResidentDto, token: string): Promise<Resident> {
    const supabase = this.supabaseService.getAuthClient(token);
    
    const { data, error } = await supabase
      .from('residents')
      .insert({
        ...dto,
        status: 'no_response',
        last_updated: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create resident: ${error.message}`);
    }

    return data;
  }

  async update(id: string, dto: UpdateResidentDto, token: string): Promise<Resident> {
    const supabase = this.supabaseService.getAuthClient(token);
    
    const { data, error } = await supabase
      .from('residents')
      .update({
        ...dto,
        last_updated: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update resident: ${error.message}`);
    }

    return data;
  }

  async delete(id: string, token: string): Promise<void> {
    const supabase = this.supabaseService.getAuthClient(token);
    
    const { error } = await supabase
      .from('residents')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete resident: ${error.message}`);
    }
  }

  async updateStatus(id: string, status: 'safe' | 'needs_help' | 'no_response', token: string): Promise<Resident> {
    return this.update(id, { status }, token);
  }

  async getStats(token: string): Promise<{
    total: number;
    safe: number;
    needs_help: number;
    no_response: number;
  }> {
    const residents = await this.findAll(token);
    
    return {
      total: residents.length,
      safe: residents.filter(r => r.status === 'safe').length,
      needs_help: residents.filter(r => r.status === 'needs_help').length,
      no_response: residents.filter(r => r.status === 'no_response').length,
    };
  }

  async resetAllStatus(token: string): Promise<void> {
    const supabase = this.supabaseService.getAuthClient(token);
    
    const { error } = await supabase
      .from('residents')
      .update({ status: 'no_response', last_updated: new Date().toISOString() })
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Update all

    if (error) {
      throw new Error(`Failed to reset statuses: ${error.message}`);
    }
  }
}
