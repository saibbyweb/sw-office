import { Resolver, Query } from '@nestjs/graphql';
import { User } from 'src/generated-nestjs-typegraphql';

@Resolver(() => User)
export class UsersResolver {
  @Query(() => String)
  hello(): string {
    return 'Hello from NestJS GraphQL!';
  }
}
