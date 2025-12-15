import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { DashboardService } from '../services/dashboard.service';
import { AuthGuard, RolesGuard } from '@common/guards';
import { Roles } from '@common/decorators';

@ApiTags('reporting')
@ApiBearerAuth()
@Controller('dashboard')
@UseGuards(AuthGuard, RolesGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  @Roles('ADMIN', 'MANAGER', 'AGENT')
  @ApiOperation({ summary: 'Obtenir les données du tableau de bord' })
  @ApiResponse({ status: 200, description: 'Données du tableau de bord' })
  async getDashboard() {
    return this.dashboardService.getDashboardData();
  }

  @Get('tickets')
  @Roles('ADMIN', 'MANAGER', 'AGENT')
  @ApiOperation({ summary: 'Obtenir les statistiques des tickets' })
  @ApiResponse({ status: 200, description: 'Statistiques des tickets' })
  async getTicketStats() {
    return this.dashboardService.getTicketStats();
  }

  @Get('billing')
  @Roles('ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Obtenir les statistiques de facturation' })
  @ApiResponse({ status: 200, description: 'Statistiques de facturation' })
  async getBillingStats() {
    return this.dashboardService.getBillingStats();
  }

  @Get('users')
  @Roles('ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Obtenir les statistiques des utilisateurs' })
  @ApiResponse({ status: 200, description: 'Statistiques des utilisateurs' })
  async getUserStats() {
    return this.dashboardService.getUserStats();
  }

  @Get('activity')
  @Roles('ADMIN', 'MANAGER', 'AGENT')
  @ApiOperation({ summary: 'Obtenir l\'activité récente' })
  @ApiResponse({ status: 200, description: 'Activité récente' })
  async getRecentActivity() {
    return this.dashboardService.getRecentActivity();
  }
}
