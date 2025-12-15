import { Module, forwardRef } from '@nestjs/common';
import { TicketsController } from './controllers/tickets.controller';
import { TicketsService } from './services/tickets.service';
import { TicketsRepository } from './repositories/tickets.repository';
import { UsersModule } from '@users/users.module';

@Module({
  imports: [forwardRef(() => UsersModule)],
  controllers: [TicketsController],
  providers: [
    TicketsService,
    {
      provide: 'ITicketsRepository',
      useClass: TicketsRepository,
    },
  ],
  exports: [TicketsService],
})
export class TicketsModule {}
