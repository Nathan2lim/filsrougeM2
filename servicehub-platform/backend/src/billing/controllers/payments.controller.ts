import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { PaymentsService } from '../services/payments.service';
import { CreatePaymentDto } from '../dto';
import { AuthGuard, RolesGuard } from '@common/guards';
import { Roles } from '@common/decorators';

@ApiTags('billing')
@ApiBearerAuth()
@Controller('payments')
@UseGuards(AuthGuard, RolesGuard)
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  @Roles('ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Enregistrer un nouveau paiement' })
  @ApiResponse({ status: 201, description: 'Paiement enregistré avec succès' })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  async create(@Body() createPaymentDto: CreatePaymentDto) {
    return this.paymentsService.create(createPaymentDto);
  }

  @Get()
  @Roles('ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Récupérer la liste des paiements' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'invoiceId', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Liste des paiements' })
  async findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('invoiceId') invoiceId?: string,
  ) {
    return this.paymentsService.findAll({
      page: page || 1,
      limit: limit || 10,
      invoiceId,
    });
  }

  @Get('invoice/:invoiceId')
  @Roles('ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Récupérer les paiements d\'une facture' })
  @ApiResponse({ status: 200, description: 'Liste des paiements de la facture' })
  async findByInvoice(@Param('invoiceId', ParseUUIDPipe) invoiceId: string) {
    return this.paymentsService.findByInvoice(invoiceId);
  }

  @Get(':id')
  @Roles('ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Récupérer un paiement par son ID' })
  @ApiResponse({ status: 200, description: 'Paiement trouvé' })
  @ApiResponse({ status: 404, description: 'Paiement non trouvé' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.paymentsService.findById(id);
  }
}
