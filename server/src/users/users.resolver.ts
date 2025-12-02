import { UseGuards } from '@nestjs/common';
import {
  Resolver,
  Query,
  Context,
  Mutation,
  Args,
  ResolveField,
  Parent,
} from '@nestjs/graphql';
import { JwtGuard } from 'src/auth/guards/jwt.guard';
import { User, Session } from 'src/generated-nestjs-typegraphql';
import { UsersService } from './users.service';
import { UpdateProfileInput } from './dto/update-profile.input';
import { UserProfile } from './dto/user-profile.output';
import { TeamUser } from './dto/team-user.output';

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
  @Query(() => [User])
  @UseGuards(JwtGuard)
  getUsers(): Promise<User[]> {
    return this.usersService.findAll();
  }
  @Query(() => [TeamUser])
  @UseGuards(JwtGuard)
  getTeamUsers(): Promise<TeamUser[]> {
    return this.usersService.getTeamUsers();
  }
  @Query(() => UserProfile)
  @UseGuards(JwtGuard)
  async getUserProfile(@Args('userId') userId: string): Promise<UserProfile> {
    return this.usersService.getUserProfile(userId);
  }
  @Mutation(() => User)
  @UseGuards(JwtGuard)
  async updateProfile(
    @Context() context: GraphQLContext,
    @Args('input') input: UpdateProfileInput,
  ): Promise<User> {
    const userId = context.req.user.id;
    return this.usersService.updateProfile(userId, input);
  }
  @ResolveField(() => Session, { nullable: true })
  activeSession(
    @Parent() user: User & { sessions: Session[] },
  ): Session | null {
    return user.sessions?.[0] || null;
  }
}
