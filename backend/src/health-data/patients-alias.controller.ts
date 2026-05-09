import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { HealthDataService } from './health-data.service';

/**
 * Legacy alias routes: /patients/:id/* → delegates to HealthDataService.
 * The frontend still uses the /patients/ prefix in many places; these routes
 * preserve compatibility without duplicating business logic.
 */
@ApiTags('Patients (Alias)')
@Controller('patients/:id')
export class PatientsAliasController {
  constructor(private readonly healthDataService: HealthDataService) {}

  @Get('appointments')
  async getAppointments(@Param('id') id: string, @Query('limit') limit?: string) {
    try {
      const data = await this.healthDataService.getPatientAppointments(id, limit ? parseInt(limit) : undefined);
      return { success: true, data };
    } catch {
      return { success: true, data: [] };
    }
  }

  @Get('prescriptions')
  async getPrescriptions(@Param('id') id: string, @Query('active') active?: string, @Query('limit') limit?: string, @Query('offset') offset?: string) {
    const data = await this.healthDataService.getPrescriptions(id, {
      active: active !== undefined ? active === 'true' : undefined,
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined,
    });
    return { success: true, data };
  }

  @Get('medical-records')
  async getMedicalRecords(@Param('id') id: string, @Query('type') type?: string, @Query('limit') limit?: string, @Query('offset') offset?: string) {
    const result = await this.healthDataService.getMedicalRecords(id, {
      type, limit: limit ? parseInt(limit) : undefined, offset: offset ? parseInt(offset) : undefined,
    });
    return { success: true, data: result.records, total: result.total };
  }

  @Get('lab-tests')
  async getLabTests(@Param('id') id: string, @Query('status') status?: string, @Query('limit') limit?: string, @Query('offset') offset?: string) {
    const result = await this.healthDataService.getLabTests(id, {
      status, limit: limit ? parseInt(limit) : undefined, offset: offset ? parseInt(offset) : undefined,
    });
    return { success: true, data: result.tests, total: result.total };
  }

  @Get('claims')
  async getClaims(@Param('id') id: string) {
    return { success: true, data: await this.healthDataService.getClaims(id) };
  }

  @Get('pill-reminders')
  async getPillReminders(@Param('id') id: string, @Query('active') active?: string) {
    const data = await this.healthDataService.getPillReminders(id, active !== undefined ? active === 'true' : undefined);
    return { success: true, data };
  }

  @Get('vital-signs')
  async getVitalSigns(@Param('id') id: string, @Query('latest') latest?: string, @Query('limit') limit?: string) {
    const data = await this.healthDataService.getVitalSigns(id, { latest: latest === 'true', limit: limit ? parseInt(limit) : undefined });
    return { success: true, data };
  }

  @Get('bookings')
  async getBookings(@Param('id') id: string, @Query('type') type?: string, @Query('limit') limit?: string) {
    try {
      const data = await this.healthDataService.getPatientBookings(id, type, limit ? parseInt(limit) : undefined);
      return { success: true, data };
    } catch {
      return { success: true, data: [] };
    }
  }
}
