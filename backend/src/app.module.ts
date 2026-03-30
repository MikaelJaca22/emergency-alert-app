import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { ResidentsModule } from './residents/residents.module';
import { AlertsModule } from './alerts/alerts.module';
import { SupabaseModule } from './shared/supabase/supabase.module';
import { GuardsModule } from './shared/guards/guards.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    SupabaseModule,
    GuardsModule,
    AuthModule,
    ResidentsModule,
    AlertsModule,
  ],
})
export class AppModule {}
