import { UseGuards } from '@nestjs/common';
import { Resolver, Query, Context } from '@nestjs/graphql';
import { JwtGuard } from 'src/auth/guards/jwt.guard';
import { User } from 'src/generated-nestjs-typegraphql';
import { UsersService } from './users.service';

interface RequestWithUser {
  user: {
    id: string;
  };
}

export interface GraphQLContext {
  req: RequestWithUser;
}

@Resolver(() => User)
export class UsersResolver {
  constructor(private readonly usersService: UsersService) {}
  @Query(() => String)
  hello(): string {
    return 'Hello from NestJS GraphQL!';
  }
  @Query(() => User)
  @UseGuards(JwtGuard)
  async me(@Context() context: GraphQLContext): Promise<User> {
    const userId = context.req.user.id;
    console.log(userId);
    return this.usersService.findById(userId);
  }
}
