import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { ReportsService } from '../services/reports.service';
import { ReportFilterDto } from '../dto';
import { AuthGuard, RolesGuard } from '@common/guards';
import { Roles } from '@common/decorators';

@ApiTags('reporting')
@ApiBearerAuth()
@Controller('reports')
@UseGuards(AuthGuard, RolesGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('tickets')
  @Roles('ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Générer un rapport des tickets' })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'priority', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Rapport des tickets' })
  async getTicketsReport(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('status') status?: string,
    @Query('priority') priority?: string,
  ) {
    return this.reportsService.generateTicketsReport({
      startDate,
      endDate,
      status,
      priority,
    });
  }

  @Get('billing')
  @Roles('ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Générer un rapport de facturation' })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Rapport de facturation' })
  async getBillingReport(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('status') status?: string,
  ) {
    return this.reportsService.generateBillingReport({
      startDate,
      endDate,
      status,
    });
  }

  @Get('performance')
  @Roles('ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Générer un rapport de performance' })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Rapport de performance' })
  async getPerformanceReport(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.reportsService.generatePerformanceReport({
      startDate,
      endDate,
    });
  }

  @Post('export/csv')
  @Roles('ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Exporter un rapport en CSV' })
  @ApiResponse({ status: 200, description: 'Fichier CSV' })
  async exportCsv(
    @Body() filterDto: ReportFilterDto,
    @Res() res: Response,
  ) {
    const csvData = await this.reportsService.exportToCsv(filterDto);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=report-${Date.now()}.csv`,
    );
    res.send(csvData);
  }
}
