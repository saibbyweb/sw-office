import { ObjectType, Field, ID } from '@nestjs/graphql';
import { WorkSession } from '../../schema/session.types';
import { Project } from '../../schema/project.types';
import { Break } from '../../schema/break.types';

@ObjectType()
export class Segment {
  @Field(() => ID)
  id: string;

  @Field(() => ID)
  sessionId: string;

  @Field(() => WorkSession)
  session: WorkSession;

  @Field()
  type: string;

  @Field(() => ID, { nullable: true })
  projectId?: string;

  @Field(() => Project, { nullable: true })
  project?: Project;

  @Field(() => ID, { nullable: true })
  breakId?: string;

  @Field(() => Break, { nullable: true })
  break?: Break;

  @Field(() => Date)
  startTime: Date;

  @Field(() => Date, { nullable: true })
  endTime?: Date;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;

  @Field(() => Date, { nullable: true })
  duration: number;
}
