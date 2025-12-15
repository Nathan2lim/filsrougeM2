import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
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
import { InvoicesService } from '../services/invoices.service';
import { CreateInvoiceDto } from '../dto';
import { AuthGuard, RolesGuard } from '@common/guards';
import { Roles, CurrentUser } from '@common/decorators';

@ApiTags('billing')
@ApiBearerAuth()
@Controller('invoices')
@UseGuards(AuthGuard, RolesGuard)
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Post()
  @Roles('ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Créer une nouvelle facture' })
  @ApiResponse({ status: 201, description: 'Facture créée avec succès' })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  async create(
    @Body() createInvoiceDto: CreateInvoiceDto,
    @CurrentUser('sub') userId: string,
  ) {
    return this.invoicesService.create(createInvoiceDto, userId);
  }

  @Get()
  @Roles('ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Récupérer la liste des factures' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Liste des factures' })
  async findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: string,
  ) {
    return this.invoicesService.findAll({
      page: page || 1,
      limit: limit || 10,
      status,
    });
  }

  @Get('stats')
  @Roles('ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Obtenir les statistiques de facturation' })
  @ApiResponse({ status: 200, description: 'Statistiques de facturation' })
  async getStats() {
    return this.invoicesService.getStats();
  }

  @Get(':id')
  @Roles('ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Récupérer une facture par son ID' })
  @ApiResponse({ status: 200, description: 'Facture trouvée' })
  @ApiResponse({ status: 404, description: 'Facture non trouvée' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.invoicesService.findById(id);
  }

  @Put(':id/send')
  @Roles('ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Envoyer une facture' })
  @ApiResponse({ status: 200, description: 'Facture envoyée' })
  async send(@Param('id', ParseUUIDPipe) id: string) {
    return this.invoicesService.send(id);
  }

  @Put(':id/cancel')
  @Roles('ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Annuler une facture' })
  @ApiResponse({ status: 200, description: 'Facture annulée' })
  async cancel(@Param('id', ParseUUIDPipe) id: string) {
    return this.invoicesService.cancel(id);
  }

  @Delete(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Supprimer une facture' })
  @ApiResponse({ status: 200, description: 'Facture supprimée' })
  @ApiResponse({ status: 404, description: 'Facture non trouvée' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.invoicesService.delete(id);
  }
}
