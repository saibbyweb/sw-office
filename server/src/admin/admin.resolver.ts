import { Resolver, Query, Args, ID } from '@nestjs/graphql';
import { Session, User } from '../generated-nestjs-typegraphql';
import { GetSessionsInput } from '../types/session.types';
import { SessionService } from '../services/session.service';
import { UsersService } from '../users/users.service';

@Resolver()
export class AdminResolver {
  constructor(
    private readonly sessionService: SessionService,
    private readonly usersService: UsersService,
  ) {}

  @Query(() => [User])
  async adminUsers(): Promise<User[]> {
    return this.usersService.findAll();
  }

  @Query(() => Session, { nullable: true })
  async adminSession(
    @Args('sessionId', { type: () => ID }) sessionId: string,
  ): Promise<Session | null> {
    return this.sessionService.getSessionById(sessionId);
  }

  @Query(() => [Session])
  async adminUserSessions(
    @Args('userId', { type: () => ID }) userId: string,
    @Args('input') input: GetSessionsInput,
  ): Promise<Session[]> {
    return this.sessionService.getUserSessions(userId, input);
  }
}
