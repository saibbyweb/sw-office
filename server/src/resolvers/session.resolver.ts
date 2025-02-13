import { Resolver, Mutation, Args, ID, Query } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import {
  WorkSession,
  StartSessionInput,
  SwitchProjectInput,
} from '../schema/session.types';
import { SessionService } from '../services/session.service';

@Resolver(() => WorkSession)
@UseGuards(JwtGuard)
export class SessionResolver {
  constructor(private readonly sessionService: SessionService) {}

  @Query(() => WorkSession, { nullable: true })
  async activeSession(
    @CurrentUser() userId: string,
  ): Promise<WorkSession | null> {
    return this.sessionService.getActiveSession(userId);
  }

  @Mutation(() => WorkSession)
  async startSession(
    @CurrentUser() userId: string,
    @Args('input') input: StartSessionInput,
  ): Promise<WorkSession> {
    return this.sessionService.startSession(userId, input);
  }

  @Mutation(() => WorkSession)
  async endSession(
    @CurrentUser() userId: string,
    @Args('id', { type: () => ID }) id: string,
  ): Promise<WorkSession> {
    return this.sessionService.endSession(userId, id);
  }

  @Mutation(() => WorkSession)
  async switchProject(
    @CurrentUser() userId: string,
    @Args('sessionId', { type: () => ID }) sessionId: string,
    @Args('input') input: SwitchProjectInput,
  ): Promise<WorkSession> {
    return this.sessionService.switchProject(userId, sessionId, input);
  }
}
