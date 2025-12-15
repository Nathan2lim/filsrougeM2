import { HttpException, HttpStatus } from '@nestjs/common';

export class BusinessException extends HttpException {
  constructor(
    message: string,
    errorCode?: string,
    statusCode: HttpStatus = HttpStatus.BAD_REQUEST,
  ) {
    super(
      {
        statusCode,
        message,
        errorCode: errorCode || 'BUSINESS_ERROR',
        timestamp: new Date().toISOString(),
      },
      statusCode,
    );
  }
}

export class EntityNotFoundException extends BusinessException {
  constructor(entityName: string, identifier?: string | number) {
    const message = identifier
      ? `${entityName} avec l'identifiant "${identifier}" non trouvé`
      : `${entityName} non trouvé`;
    super(message, 'ENTITY_NOT_FOUND', HttpStatus.NOT_FOUND);
  }
}

export class DuplicateEntityException extends BusinessException {
  constructor(entityName: string, field: string, value: string) {
    super(
      `${entityName} avec ${field} "${value}" existe déjà`,
      'DUPLICATE_ENTITY',
      HttpStatus.CONFLICT,
    );
  }
}

export class InvalidOperationException extends BusinessException {
  constructor(message: string) {
    super(message, 'INVALID_OPERATION', HttpStatus.UNPROCESSABLE_ENTITY);
  }
}

export class UnauthorizedActionException extends BusinessException {
  constructor(action: string) {
    super(
      `Vous n'êtes pas autorisé à effectuer l'action: ${action}`,
      'UNAUTHORIZED_ACTION',
      HttpStatus.FORBIDDEN,
    );
  }
}
