import { ObjectType, Field, ID } from '@nestjs/graphql';
import { Session } from '../../generated-nestjs-typegraphql';
import { User } from 'src/generated-nestjs-typegraphql';
import { WorkLog } from '../../generated-nestjs-typegraphql';
import { Segment } from '../../segments/entities/segment.entity';

@ObjectType()
export class Project {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field()
  isCustom: boolean;

  @Field(() => ID)
  userId: string;

  @Field(() => User)
  user: User;

  @Field(() => [Session])
  sessions: Session[];

  @Field(() => [WorkLog])
  workLogs: WorkLog[];

  @Field(() => [Segment])
  segments: Segment[];

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;
}
