import {
  ObjectType,
  Field,
  ID,
  InputType,
  registerEnumType,
  Int,
} from '@nestjs/graphql';

export enum SessionStatus {
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  TERMINATED = 'TERMINATED',
}

registerEnumType(SessionStatus, {
  name: 'SessionStatus',
  description: 'Status of a work session',
});

@ObjectType()
export class WorkSession {
  @Field(() => ID)
  id: string;

  @Field(() => ID)
  userId: string;

  @Field(() => Date)
  startTime: Date;

  @Field(() => Date, { nullable: true })
  endTime: Date | null;

  @Field(() => Int)
  totalDuration: number;

  @Field(() => Int)
  totalBreakTime: number;

  @Field(() => String)
  status: string;

  @Field(() => ID, { nullable: true })
  projectId: string | null;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;
}

@InputType()
export class StartSessionInput {
  @Field(() => ID)
  projectId: string;
}

@InputType()
export class SwitchProjectInput {
  @Field(() => ID)
  projectId: string;
}
