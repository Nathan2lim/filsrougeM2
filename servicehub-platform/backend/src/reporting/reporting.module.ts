import { Module, forwardRef } from '@nestjs/common';
import { DashboardController } from './controllers/dashboard.controller';
import { ReportsController } from './controllers/reports.controller';
import { DashboardService } from './services/dashboard.service';
import { ReportsService } from './services/reports.service';
import { KpiService } from './services/kpi.service';
import { UsersModule } from '@users/users.module';

@Module({
  imports: [forwardRef(() => UsersModule)],
  controllers: [DashboardController, ReportsController],
  providers: [DashboardService, ReportsService, KpiService],
  exports: [DashboardService, ReportsService, KpiService],
})
export class ReportingModule {}
