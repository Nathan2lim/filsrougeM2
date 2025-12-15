import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsNotEmpty } from 'class-validator';

export class AssignTicketDto {
  @ApiProperty({
    example: 'uuid-user-id',
    description: 'ID de l\'agent à qui assigner le ticket',
  })
  @IsUUID('4', { message: 'L\'ID de l\'agent doit être un UUID valide' })
  @IsNotEmpty({ message: 'L\'ID de l\'agent est requis' })
  assignedToId: string;
}
