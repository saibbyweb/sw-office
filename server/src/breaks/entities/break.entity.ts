import { ObjectType, Field, ID, Int } from '@nestjs/graphql';
import { Session } from '../../generated-nestjs-typegraphql';
import { User } from 'src/generated-nestjs-typegraphql';
import { Segment } from '../../segments/entities/segment.entity';
import { BreakType } from '../../generated-nestjs-typegraphql';

@ObjectType()
export class Break {
  @Field(() => ID)
  id: string;

  @Field(() => ID)
  userId: string;

  @Field(() => User)
  user: User;

  @Field(() => ID)
  sessionId: string;

  @Field(() => Session)
  session: Session;

  @Field(() => BreakType)
  type: BreakType;

  @Field(() => Date)
  startTime: Date;

  @Field(() => Date, { nullable: true })
  endTime?: Date;

  @Field(() => Int)
  duration: number;

  @Field(() => [Segment], { nullable: true })
  segments?: Segment[];

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;
}
