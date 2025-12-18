import { Module, Global } from '@nestjs/common';
import { TicketFactory } from './factories/ticket.factory';
import { InvoiceFactory } from './factories/invoice.factory';
import { UserFactory } from './factories/user.factory';
import { EntityFactory } from './factories/entity.factory';

/**
 * Module global pour les patterns de création
 * Fournit les factories comme providers injectables
 */
@Global()
@Module({
  providers: [
    TicketFactory,
    InvoiceFactory,
    UserFactory,
    EntityFactory,
    {
      provide: 'TICKET_FACTORY',
      useClass: TicketFactory,
    },
    {
      provide: 'INVOICE_FACTORY',
      useClass: InvoiceFactory,
    },
    {
      provide: 'USER_FACTORY',
      useClass: UserFactory,
    },
    {
      provide: 'ENTITY_FACTORY',
      useClass: EntityFactory,
    },
  ],
  exports: [
    TicketFactory,
    InvoiceFactory,
    UserFactory,
    EntityFactory,
    'TICKET_FACTORY',
    'INVOICE_FACTORY',
    'USER_FACTORY',
    'ENTITY_FACTORY',
  ],
})
export class PatternsModule {}
