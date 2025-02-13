export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
}

export enum SessionStatus {
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  TERMINATED = 'TERMINATED',
}

export enum BreakType {
  SHORT = 'SHORT',
  LUNCH = 'LUNCH',
  OTHER = 'OTHER',
}

export enum ErrorCode {
  UNAUTHORIZED = 'UNAUTHORIZED',
  INVALID_INPUT = 'INVALID_INPUT',
  NOT_FOUND = 'NOT_FOUND',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
}
