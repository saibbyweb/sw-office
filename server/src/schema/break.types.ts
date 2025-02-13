import {
  ObjectType,
  Field,
  ID,
  InputType,
  registerEnumType,
  Int,
} from '@nestjs/graphql';

export enum BreakType {
  SHORT = 'SHORT',
  LUNCH = 'LUNCH',
  OTHER = 'OTHER',
}

registerEnumType(BreakType, {
  name: 'BreakType',
  description: 'Type of break',
});

@ObjectType()
export class Break {
  @Field(() => ID)
  id: string;

  @Field(() => ID)
  userId: string;

  @Field(() => ID)
  sessionId: string;

  @Field(() => String)
  type: string;

  @Field(() => Date)
  startTime: Date;

  @Field(() => Date, { nullable: true })
  endTime: Date | null;

  @Field(() => Int)
  duration: number;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;
}

@InputType()
export class StartBreakInput {
  @Field(() => String)
  type: string;
}
