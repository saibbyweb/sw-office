import { ObjectType, Field, ID, registerEnumType } from '@nestjs/graphql';
import { Session } from '../../generated-nestjs-typegraphql';
import { Project } from '../../generated-nestjs-typegraphql';
import { Break } from '../../generated-nestjs-typegraphql';
import { WorkLog } from '../../generated-nestjs-typegraphql';
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

  @Field(() => [Session], { nullable: true })
  sessions?: Session[];

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
