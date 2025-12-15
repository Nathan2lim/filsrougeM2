import { ApiProperty } from '@nestjs/swagger';

export class AttachmentEntity {
  @ApiProperty({ example: 'uuid-attachment-id' })
  id: string;

  @ApiProperty({ example: 'document.pdf' })
  filename: string;

  @ApiProperty({ example: '/uploads/tickets/document.pdf' })
  path: string;

  @ApiProperty({ example: 'application/pdf' })
  mimeType: string;

  @ApiProperty({ example: 1024000 })
  size: number;

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: 'uuid-ticket-id' })
  ticketId: string;

  constructor(partial: Partial<AttachmentEntity>) {
    Object.assign(this, partial);
  }
}
