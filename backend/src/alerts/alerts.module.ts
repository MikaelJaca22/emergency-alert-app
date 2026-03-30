import { Module } from '@nestjs/common';
import { AlertsService } from './alerts.service';
import { AlertsController } from './alerts.controller';
import { InfobipService } from './infobip.service';
import { ResidentsModule } from '../residents/residents.module';

@Module({
  imports: [ResidentsModule],
  controllers: [AlertsController],
  providers: [AlertsService, InfobipService],
  exports: [AlertsService],
})
export class AlertsModule {}
