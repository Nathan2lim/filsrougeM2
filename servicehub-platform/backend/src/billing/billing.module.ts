import { Module, forwardRef } from '@nestjs/common';
import { InvoicesController } from './controllers/invoices.controller';
import { PaymentsController } from './controllers/payments.controller';
import { InvoicesService } from './services/invoices.service';
import { PaymentsService } from './services/payments.service';
import { BillingCalculatorService } from './services/billing-calculator.service';
import { InvoicesRepository } from './repositories/invoices.repository';
import { UsersModule } from '@users/users.module';

@Module({
  imports: [forwardRef(() => UsersModule)],
  controllers: [InvoicesController, PaymentsController],
  providers: [
    InvoicesService,
    PaymentsService,
    BillingCalculatorService,
    {
      provide: 'IInvoicesRepository',
      useClass: InvoicesRepository,
    },
  ],
  exports: [InvoicesService, PaymentsService, BillingCalculatorService],
})
export class BillingModule {}
