import { ObjectType, Field, ID, registerEnumType } from '@nestjs/graphql';
import { WorkSession } from '../../schema/session.types';
import { Project } from '../../schema/project.types';
import { Break } from '../../schema/break.types';
import { WorkLog } from '../../schema/worklog.types';
import { UserRole } from '../../common/enums';

registerEnumType(UserRole, {
  name: 'UserRole',
  description: 'The role of a user',
});

@ObjectType()
export class User {
  @Field(() => ID)
  id: string;

  @Field()
  email: string;

  // Password is not exposed in GraphQL type
  password: string;

  @Field()
  name: string;

  @Field(() => UserRole)
  role: UserRole;

  @Field(() => [WorkSession], { nullable: true })
  sessions?: WorkSession[];

  @Field(() => [Break], { nullable: true })
  breaks?: Break[];

  @Field(() => [Project], { nullable: true })
  projects?: Project[];

  @Field(() => [WorkLog], { nullable: true })
  workLogs?: WorkLog[];

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;
}
