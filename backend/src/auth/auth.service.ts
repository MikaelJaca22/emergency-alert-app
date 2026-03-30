import { Injectable, UnauthorizedException } from '@nestjs/common';
import { SupabaseService } from '../shared/supabase/supabase.service';

export interface AuthUser {
  id: string;
  email: string;
  username?: string;
  full_name?: string;
}

export interface RegisterDto {
  email: string;
  password: string;
  username: string;
  full_name: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

@Injectable()
export class AuthService {
  constructor(private supabaseService: SupabaseService) {}

  async register(dto: RegisterDto): Promise<{ user: AuthUser; access_token: string }> {
    const supabase = this.supabaseService.getClient();
    
    // Register user with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: dto.email,
      password: dto.password,
      options: {
        data: {
          username: dto.username,
          full_name: dto.full_name,
        },
      },
    });

    if (authError) {
      throw new UnauthorizedException(authError.message);
    }

    // Create user profile in users table
    const { error: profileError } = await supabase.from('users').insert({
      id: authData.user.id,
      email: dto.email,
      username: dto.username,
      full_name: dto.full_name,
      role: 'admin',
    });

    if (profileError) {
      console.error('Profile creation error:', profileError);
    }

    return {
      user: {
        id: authData.user.id,
        email: authData.user.email,
        username: dto.username,
        full_name: dto.full_name,
      },
      access_token: authData.session.access_token,
    };
  }

  async login(dto: LoginDto): Promise<{ user: AuthUser; access_token: string }> {
    const supabase = this.supabaseService.getClient();
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email: dto.email,
      password: dto.password,
    });

    if (error) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Fetch user profile
    const { data: profile } = await supabase
      .from('users')
      .select('*')
      .eq('id', data.user.id)
      .single();

    return {
      user: {
        id: data.user.id,
        email: data.user.email,
        username: profile?.username,
        full_name: profile?.full_name,
      },
      access_token: data.session.access_token,
    };
  }

  async logout(token: string): Promise<void> {
    const supabase = this.supabaseService.getAuthClient(token);
    await supabase.auth.signOut();
  }

  async validateToken(token: string): Promise<AuthUser> {
    const supabase = this.supabaseService.getAuthClient(token);
    
    const { data, error } = await supabase.auth.getUser();
    
    if (error || !data.user) {
      throw new UnauthorizedException('Invalid token');
    }

    // Fetch user profile
    const { data: profile } = await supabase
      .from('users')
      .select('*')
      .eq('id', data.user.id)
      .single();

    return {
      id: data.user.id,
      email: data.user.email,
      username: profile?.username,
      full_name: profile?.full_name,
    };
  }
}
