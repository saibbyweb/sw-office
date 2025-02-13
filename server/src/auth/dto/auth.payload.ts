import { ObjectType, Field } from '@nestjs/graphql';
import { User } from 'src/generated-nestjs-typegraphql';

@ObjectType()
export class AuthPayload {
  @Field()
  token: string;

  @Field(() => User)
  user: User;
}
