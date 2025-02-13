import { Resolver, Query } from '@nestjs/graphql';
import { User } from './entities/user.entity';

@Resolver(() => User)
export class UsersResolver {
  @Query(() => String)
  hello(): string {
    return 'Hello from NestJS GraphQL!';
  }
}
