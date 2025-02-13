import { ObjectType, Field, ID } from '@nestjs/graphql';
import { WorkSession } from '../../schema/session.types';

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

  @Field(() => [WorkSession], { nullable: true })
  sessions?: WorkSession[];

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;
}
