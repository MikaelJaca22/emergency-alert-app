import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { ResidentsModule } from './residents/residents.module';
import { AlertsModule } from './alerts/alerts.module';
import { SupabaseModule } from './shared/supabase/supabase.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    SupabaseModule,
    AuthModule,
    ResidentsModule,
    AlertsModule,
  ],
})
export class AppModule {}
