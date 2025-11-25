import {
  Resolver,
  Mutation,
  Args,
  ID,
  Query,
  Context,
  Field,
  ObjectType,
} from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { Session } from '../generated-nestjs-typegraphql';
import {
  StartSessionInput,
  SwitchProjectInput,
  GetSessionsInput,
  GetSessionDatesInput,
} from '../types/session.types';
import { SessionService } from '../services/session.service';
import { GraphQLContext } from 'src/users/users.resolver';

@ObjectType()
class SessionDate {
  @Field(() => Date)
  startTime: Date;

  @Field(() => ID)
  id: string;
}

@Resolver(() => Session)
export class SessionResolver {
  constructor(private readonly sessionService: SessionService) {}

  @Query(() => [Session])
  @UseGuards(JwtGuard)
  async userSessions(
    @Context() context: GraphQLContext,
    @Args('input') input: GetSessionsInput,
  ): Promise<Session[]> {
    const userId = context.req.user.id;
    return this.sessionService.getUserSessions(userId, input);
  }

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
    @Args('input') input: SwitchProjectInput,
  ): Promise<Session> {
    const userId = context.req.user.id;
    return this.sessionService.switchProject(userId, input.sessionId, input);
  }

  @Query(() => [SessionDate])
  @UseGuards(JwtGuard)
  async userSessionDates(
    @Context() context: GraphQLContext,
    @Args('input') input: GetSessionDatesInput,
  ): Promise<SessionDate[]> {
    const userId = context.req.user.id;
    const sessions = await this.sessionService.getUserSessions(userId, {
      startDate: input.startDate,
      endDate: input.endDate,
    });
    return sessions.map((session) => ({
      startTime: session.startTime,
      id: session.id,
    }));
  }

  @Query(() => [SessionDate])
  @UseGuards(JwtGuard)
  async getUserSessionDates(
    @Args('userId') userId: string,
    @Args('input') input: GetSessionDatesInput,
  ): Promise<SessionDate[]> {
    const sessions = await this.sessionService.getUserSessions(userId, {
      startDate: input.startDate,
      endDate: input.endDate,
    });
    return sessions.map((session) => ({
      startTime: session.startTime,
      id: session.id,
    }));
  }

  @Query(() => Session, { nullable: true })
  @UseGuards(JwtGuard)
  async session(
    @Context() context: GraphQLContext,
    @Args('id', { type: () => ID }) id: string,
  ): Promise<Session | null> {
    const userId = context.req.user.id;
    const sessions = await this.sessionService.getUserSessions(userId, {
      startDate: undefined,
      endDate: undefined,
      projectIds: undefined,
      statuses: undefined,
      sortDescending: undefined,
    });
    return sessions.find((session) => session.id === id) || null;
  }
}
