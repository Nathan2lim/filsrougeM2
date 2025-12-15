import { ApiProperty } from '@nestjs/swagger';

export class CommentEntity {
  @ApiProperty({ example: 'uuid-comment-id' })
  id: string;

  @ApiProperty({ example: 'Contenu du commentaire...' })
  content: string;

  @ApiProperty({ example: false })
  isInternal: boolean;

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z' })
  updatedAt: Date;

  @ApiProperty({ example: 'uuid-ticket-id' })
  ticketId: string;

  @ApiProperty({ example: 'uuid-user-id' })
  authorId: string;

  constructor(partial: Partial<CommentEntity>) {
    Object.assign(this, partial);
  }
}
