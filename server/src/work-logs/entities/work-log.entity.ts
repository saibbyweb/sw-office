import { ObjectType, Field, ID } from '@nestjs/graphql';
import { Session } from '../../generated-nestjs-typegraphql';
import { Project } from '../../generated-nestjs-typegraphql';
import { User } from 'src/generated-nestjs-typegraphql';

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

  @Field(() => Session)
  session: Session;

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
