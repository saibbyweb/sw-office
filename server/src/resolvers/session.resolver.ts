import { Resolver, Mutation, Args, ID, Query, Context } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { Session } from '../generated-nestjs-typegraphql';
import { StartSessionInput, SwitchProjectInput } from '../types/session.types';
import { SessionService } from '../services/session.service';
import { GraphQLContext } from 'src/users/users.resolver';

@Resolver(() => Session)
export class SessionResolver {
  constructor(private readonly sessionService: SessionService) {}

  @Query(() => Session, { nullable: true })
  @UseGuards(JwtGuard)
  async activeSession(
    @Context() context: GraphQLContext,
  ): Promise<Session | null> {
    const userId = context.req.user.id;
    console.log('Checking active session for user:', userId);
    return this.sessionService.getActiveSession(userId);
  }

  @Mutation(() => Session)
  @UseGuards(JwtGuard)
  async startSession(
    @Context() context: GraphQLContext,
    @Args('input') input: StartSessionInput,
  ): Promise<Session> {
    const userId = context.req.user.id;
    console.log('Starting session for user:', userId);
    return this.sessionService.startSession(userId, input);
  }

  @Mutation(() => Session)
  @UseGuards(JwtGuard)
  async endSession(
    @Context() context: GraphQLContext,
    @Args('id', { type: () => ID }) id: string,
  ): Promise<Session> {
    const userId = context.req.user.id;
    return this.sessionService.endSession(userId, id);
  }

  @Mutation(() => Session)
  @UseGuards(JwtGuard)
  async switchProject(
    @Context() context: GraphQLContext,
    @Args('sessionId', { type: () => ID }) sessionId: string,
    @Args('input') input: SwitchProjectInput,
  ): Promise<Session> {
    const userId = context.req.user.id;
    return this.sessionService.switchProject(userId, sessionId, input);
  }
}
