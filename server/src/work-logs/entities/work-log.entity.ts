import { ObjectType, Field, ID } from '@nestjs/graphql';
import { WorkSession } from '../../schema/session.types';
import { Project } from '../../schema/project.types';
import { User } from '../../users/entities/user.entity';

@ObjectType()
export class WorkLog {
  @Field(() => ID)
  id: string;

  @Field(() => ID)
  userId: string;

  @Field(() => User)
  user: User;

  @Field(() => ID)
  sessionId: string;

  @Field(() => WorkSession)
  session: WorkSession;

  @Field(() => ID)
  projectId: string;

  @Field(() => Project)
  project: Project;

  @Field()
  content: string;

  @Field(() => [String])
  links: string[];

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;
}
