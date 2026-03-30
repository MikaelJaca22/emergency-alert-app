import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService implements OnModuleInit {
  private supabase: SupabaseClient;

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseKey = this.configService.get<string>('SUPABASE_ANON_KEY');
    
    if (!supabaseUrl || !supabaseKey) {
      console.warn('Supabase credentials not configured. Using placeholder values.');
      // Use placeholder values for development
      this.supabase = createClient(
        'https://placeholder.supabase.co',
        'placeholder-key'
      );
    } else {
      this.supabase = createClient(supabaseUrl, supabaseKey);
    }
  }

  getClient(): SupabaseClient {
    return this.supabase;
  }

  // Helper method to get authenticated client
  getAuthClient(accessToken: string): SupabaseClient {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL') || 'https://placeholder.supabase.co';
    const supabaseKey = this.configService.get<string>('SUPABASE_ANON_KEY') || 'placeholder-key';
    
    return createClient(supabaseUrl, supabaseKey, {
      global: {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    });
  }
}
