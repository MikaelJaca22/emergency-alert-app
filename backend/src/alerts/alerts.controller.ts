import { Controller, Get, Post, Put, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AlertsService, CreateAlertDto } from './alerts.service';
import { InfobipService } from './infobip.service';
import { JwtAuthGuard } from '../shared/guards/jwt-auth.guard';

@ApiTags('Alerts')
@Controller('alerts')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AlertsController {
  constructor(
    private alertsService: AlertsService,
    private infobipService: InfobipService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get all alerts' })
  @ApiResponse({ status: 200, description: 'Returns list of alerts' })
  async findAll(@Request() req) {
    const token = req.headers.authorization?.split(' ')[1];
    return this.alertsService.findAll(token);
  }

  @Get('active')
  @ApiOperation({ summary: 'Get active alerts' })
  @ApiResponse({ status: 200, description: 'Returns active alerts' })
  async getActive(@Request() req) {
    const token = req.headers.authorization?.split(' ')[1];
    return this.alertsService.getActiveAlerts(token);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an alert by ID' })
  @ApiResponse({ status: 200, description: 'Returns an alert' })
  async findOne(@Param('id') id: string, @Request() req) {
    const token = req.headers.authorization?.split(' ')[1];
    return this.alertsService.findOne(id, token);
  }

  @Post()
  @ApiOperation({ summary: 'Create and send a new alert' })
  @ApiResponse({ status: 201, description: 'Alert created and sent successfully' })
  async create(@Body() dto: CreateAlertDto, @Request() req) {
    const token = req.headers.authorization?.split(' ')[1];
    return this.alertsService.create(dto, token);
  }

  @Put(':id/resolve')
  @ApiOperation({ summary: 'Resolve an alert' })
  @ApiResponse({ status: 200, description: 'Alert resolved successfully' })
  async resolve(@Param('id') id: string, @Request() req) {
    const token = req.headers.authorization?.split(' ')[1];
    return this.alertsService.resolve(id, token);
  }

  @Put(':id/cancel')
  @ApiOperation({ summary: 'Cancel an alert' })
  @ApiResponse({ status: 200, description: 'Alert cancelled successfully' })
  async cancel(@Param('id') id: string, @Request() req) {
    const token = req.headers.authorization?.split(' ')[1];
    return this.alertsService.cancel(id, token);
  }

  @Post('reset')
  @ApiOperation({ summary: 'Reset the entire system' })
  @ApiResponse({ status: 200, description: 'System reset successfully' })
  async resetSystem(@Request() req) {
    const token = req.headers.authorization?.split(' ')[1];
    await this.alertsService.resetSystem(token);
    return { message: 'System reset successfully' };
  }

  @Post('simulate-response')
  @ApiOperation({ summary: 'Simulate an incoming SMS response from a resident' })
  @ApiResponse({ status: 200, description: 'Response processed' })
  async simulateResponse(@Body() body: { phone: string; keyword: string }) {
    return this.infobipService.simulateIncomingSMS(body.phone, body.keyword);
  }

  @Post('test-sms')
  @ApiOperation({ summary: 'Send a test SMS to a phone number' })
  @ApiResponse({ status: 200, description: 'Test SMS sent' })
  async testSms(@Body() body: { phone: string; message: string }) {
    return this.infobipService.sendSMS(body.phone, body.message);
  }
}
