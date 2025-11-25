import { Resolver, Query, Args, ID, Mutation } from '@nestjs/graphql';
import { Session, User, WorkLog } from '../generated-nestjs-typegraphql';
import { GetSessionsInput } from '../types/session.types';
import { SessionService } from '../services/session.service';
import { UsersService } from '../users/users.service';
import { WorkLogService } from '../services/worklog.service';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Resolver()
export class AdminResolver {
  constructor(
    private readonly sessionService: SessionService,
    private readonly usersService: UsersService,
    private readonly workLogService: WorkLogService,
    private readonly prisma: PrismaService,
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

  @Query(() => [WorkLog])
  async adminSessionWorkLogs(
    @Args('sessionId', { type: () => ID }) sessionId: string,
  ): Promise<WorkLog[]> {
    return this.workLogService.getSessionWorkLogsForAdmin(sessionId);
  }

  @Query(() => [WorkLog])
  async adminUserWorkLogs(
    @Args('userId', { type: () => ID }) userId: string,
    @Args('input') input: GetSessionsInput,
  ): Promise<WorkLog[]> {
    if (!input.startDate || !input.endDate) {
      throw new Error('Start date and end date are required');
    }
    return this.workLogService.getUserWorkLogsByDateRange(
      userId,
      input.startDate,
      input.endDate,
    );
  }

  @Mutation(() => User)
  async adminUpdateUserPassword(
    @Args('userId', { type: () => ID }) userId: string,
    @Args('newPassword') newPassword: string,
  ): Promise<User> {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    return this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });
  }

  @Mutation(() => User)
  async adminArchiveUser(
    @Args('userId', { type: () => ID }) userId: string,
    @Args('archived') archived: boolean,
  ): Promise<User> {
    return this.prisma.user.update({
      where: { id: userId },
      data: { archived },
    });
  }

  @Mutation(() => User)
  async adminUpdateUserSlackId(
    @Args('userId', { type: () => ID }) userId: string,
    @Args('slackUserId', { type: () => String, nullable: true }) slackUserId: string | null,
    @Args('avatarUrl', { type: () => String, nullable: true }) avatarUrl: string | null,
  ): Promise<User> {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        slackUserId,
        ...(avatarUrl && { avatarUrl }),
      },
    });
  }
}
