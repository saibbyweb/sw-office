import { registerEnumType } from '@nestjs/graphql';

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

registerEnumType(UserRole, {
  name: 'UserRole',
  description: 'The role of a user',
});

registerEnumType(SessionStatus, {
  name: 'SessionStatus',
  description: 'The status of a session',
});

registerEnumType(BreakType, {
  name: 'BreakType',
  description: 'The type of break',
});
