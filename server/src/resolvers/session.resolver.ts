import { Resolver, Mutation, Args, ID, Query } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Session } from '../generated-nestjs-typegraphql';
import { StartSessionInput, SwitchProjectInput } from '../types/session.types';
import { SessionService } from '../services/session.service';

@Resolver(() => Session)
// @UseGuards(JwtGuard)
export class SessionResolver {
  constructor(private readonly sessionService: SessionService) {}

  @Query(() => Session, { nullable: true })
  async activeSession(@CurrentUser() userId: string): Promise<Session | null> {
    return this.sessionService.getActiveSession(userId);
  }

  @Mutation(() => Session)
  async startSession(
    @CurrentUser() userId: string,
    @Args('input') input: StartSessionInput,
  ): Promise<Session> {
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
