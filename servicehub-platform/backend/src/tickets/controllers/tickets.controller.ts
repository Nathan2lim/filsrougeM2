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
import { TicketsService } from '../services/tickets.service';
import { CreateTicketDto, UpdateTicketDto, AssignTicketDto } from '../dto';
import { TicketStatus, TicketPriority } from '../enums';
import { AuthGuard, RolesGuard } from '@common/guards';
import { Roles, CurrentUser } from '@common/decorators';

@ApiTags('tickets')
@ApiBearerAuth()
@Controller('tickets')
@UseGuards(AuthGuard, RolesGuard)
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Post()
  @ApiOperation({ summary: 'Créer un nouveau ticket' })
  @ApiResponse({ status: 201, description: 'Ticket créé avec succès' })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  async create(
    @Body() createTicketDto: CreateTicketDto,
    @CurrentUser('sub') userId: string,
  ) {
    return this.ticketsService.create(createTicketDto, userId);
  }

  @Get()
  @ApiOperation({ summary: 'Récupérer la liste des tickets' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, enum: TicketStatus })
  @ApiQuery({ name: 'priority', required: false, enum: TicketPriority })
  @ApiQuery({ name: 'assignedToId', required: false, type: String })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Liste des tickets' })
  async findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: TicketStatus,
    @Query('priority') priority?: TicketPriority,
    @Query('assignedToId') assignedToId?: string,
    @Query('search') search?: string,
    @CurrentUser('sub') userId?: string,
    @CurrentUser('role') userRole?: string,
  ) {
    return this.ticketsService.findAll({
      page: page || 1,
      limit: limit || 10,
      status,
      priority,
      assignedToId,
      search,
      userId,
      userRole,
    });
  }

  @Get('my-tickets')
  @ApiOperation({ summary: 'Récupérer mes tickets (créés ou assignés)' })
  @ApiResponse({ status: 200, description: 'Liste de mes tickets' })
  async findMyTickets(
    @CurrentUser('sub') userId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.ticketsService.findUserTickets(userId, {
      page: page || 1,
      limit: limit || 10,
    });
  }

  @Get('stats')
  @Roles('ADMIN', 'MANAGER', 'AGENT')
  @ApiOperation({ summary: 'Obtenir les statistiques des tickets' })
  @ApiResponse({ status: 200, description: 'Statistiques des tickets' })
  async getStats() {
    return this.ticketsService.getStats();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer un ticket par son ID' })
  @ApiResponse({ status: 200, description: 'Ticket trouvé' })
  @ApiResponse({ status: 404, description: 'Ticket non trouvé' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.ticketsService.findById(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Mettre à jour un ticket' })
  @ApiResponse({ status: 200, description: 'Ticket mis à jour' })
  @ApiResponse({ status: 404, description: 'Ticket non trouvé' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateTicketDto: UpdateTicketDto,
  ) {
    return this.ticketsService.update(id, updateTicketDto);
  }

  @Put(':id/assign')
  @Roles('ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Assigner un ticket à un agent' })
  @ApiResponse({ status: 200, description: 'Ticket assigné' })
  @ApiResponse({ status: 404, description: 'Ticket non trouvé' })
  async assign(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() assignTicketDto: AssignTicketDto,
  ) {
    return this.ticketsService.assign(id, assignTicketDto.assignedToId);
  }

  @Put(':id/status')
  @ApiOperation({ summary: 'Changer le statut d\'un ticket' })
  @ApiResponse({ status: 200, description: 'Statut mis à jour' })
  async changeStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('status') status: TicketStatus,
  ) {
    return this.ticketsService.changeStatus(id, status);
  }

  @Post(':id/comments')
  @ApiOperation({ summary: 'Ajouter un commentaire à un ticket' })
  @ApiResponse({ status: 201, description: 'Commentaire ajouté' })
  async addComment(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('content') content: string,
    @Body('isInternal') isInternal: boolean,
    @CurrentUser('sub') userId: string,
  ) {
    return this.ticketsService.addComment(id, {
      content,
      isInternal: isInternal || false,
      authorId: userId,
    });
  }

  @Delete(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Supprimer un ticket' })
  @ApiResponse({ status: 200, description: 'Ticket supprimé' })
  @ApiResponse({ status: 404, description: 'Ticket non trouvé' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.ticketsService.delete(id);
  }
}
