import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ResidentsService, CreateResidentDto, UpdateResidentDto } from './residents.service';
import { JwtAuthGuard } from '../shared/guards/jwt-auth.guard';

@ApiTags('Residents')
@Controller('residents')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ResidentsController {
  constructor(private residentsService: ResidentsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all residents' })
  @ApiResponse({ status: 200, description: 'Returns list of residents' })
  async findAll(@Request() req) {
    const token = req.headers.authorization?.split(' ')[1];
    return this.residentsService.findAll(token);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get resident statistics' })
  @ApiResponse({ status: 200, description: 'Returns resident statistics' })
  async getStats(@Request() req) {
    const token = req.headers.authorization?.split(' ')[1];
    return this.residentsService.getStats(token);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a resident by ID' })
  @ApiResponse({ status: 200, description: 'Returns a resident' })
  @ApiResponse({ status: 404, description: 'Resident not found' })
  async findOne(@Param('id') id: string, @Request() req) {
    const token = req.headers.authorization?.split(' ')[1];
    return this.residentsService.findOne(id, token);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new resident' })
  @ApiResponse({ status: 201, description: 'Resident created successfully' })
  async create(@Body() dto: CreateResidentDto, @Request() req) {
    const token = req.headers.authorization?.split(' ')[1];
    return this.residentsService.create(dto, token);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a resident' })
  @ApiResponse({ status: 200, description: 'Resident updated successfully' })
  async update(@Param('id') id: string, @Body() dto: UpdateResidentDto, @Request() req) {
    const token = req.headers.authorization?.split(' ')[1];
    return this.residentsService.update(id, dto, token);
  }

  @Put(':id/status')
  @ApiOperation({ summary: 'Update resident status' })
  @ApiResponse({ status: 200, description: 'Status updated successfully' })
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: 'safe' | 'needs_help' | 'no_response',
    @Request() req,
  ) {
    const token = req.headers.authorization?.split(' ')[1];
    return this.residentsService.updateStatus(id, status, token);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a resident' })
  @ApiResponse({ status: 200, description: 'Resident deleted successfully' })
  async delete(@Param('id') id: string, @Request() req) {
    const token = req.headers.authorization?.split(' ')[1];
    await this.residentsService.delete(id, token);
    return { message: 'Resident deleted successfully' };
  }

  @Post('reset')
  @ApiOperation({ summary: 'Reset all resident statuses to no_response' })
  @ApiResponse({ status: 200, description: 'All statuses reset successfully' })
  async resetAllStatus(@Request() req) {
    const token = req.headers.authorization?.split(' ')[1];
    await this.residentsService.resetAllStatus(token);
    return { message: 'All statuses reset successfully' };
  }
}
