import { Resolver, Mutation, Args, ID, Query, Context } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Session } from '../generated-nestjs-typegraphql';
import { StartSessionInput, SwitchProjectInput } from '../types/session.types';
import { SessionService } from '../services/session.service';
import { GraphQLContext } from 'src/users/users.resolver';

@Resolver()
export class SessionResolver {
  constructor(private readonly sessionService: SessionService) {}

  @Query(() => Session, { nullable: true })
  async activeSession(@CurrentUser() userId: string): Promise<Session | null> {
    return this.sessionService.getActiveSession(userId);
  }

  @UseGuards(JwtGuard)
  @Mutation(() => Session)
  async startSession(
    @Context() context: GraphQLContext,
    @Args('input') input: StartSessionInput,
  ): Promise<Session> {
    const userId = context.req.user.id;
    console.log(userId);
    return this.sessionService.startSession(userId, input);
  }

  @Mutation(() => Session)
  async endSession(
    @CurrentUser() userId: string,
    @Args('id', { type: () => ID }) id: string,
  ): Promise<Session> {
    return this.sessionService.endSession(userId, id);
  }

  @Mutation(() => Session)
  async switchProject(
    @CurrentUser() userId: string,
    @Args('sessionId', { type: () => ID }) sessionId: string,
    @Args('input') input: SwitchProjectInput,
  ): Promise<Session> {
    return this.sessionService.switchProject(userId, sessionId, input);
  }
}
