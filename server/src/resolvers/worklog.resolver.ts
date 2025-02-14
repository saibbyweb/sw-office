import { Resolver, Mutation, Args, ID, Context, Query } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { WorkLog } from '../generated-nestjs-typegraphql';
import { AddWorkLogInput, UpdateWorkLogInput } from '../types/worklog.types';
import { WorkLogService } from '../services/worklog.service';
import { GraphQLContext } from '../users/users.resolver';

@Resolver(() => WorkLog)
@UseGuards(JwtGuard)
export class WorkLogResolver {
  constructor(private readonly workLogService: WorkLogService) {}

  @Query(() => [WorkLog])
  async sessionWorkLogs(
    @Context() context: GraphQLContext,
    @Args('sessionId', { type: () => ID }) sessionId: string,
  ): Promise<WorkLog[]> {
    const userId = context.req.user.id;
    return this.workLogService.getSessionWorkLogs(userId, sessionId);
  }

  @Mutation(() => WorkLog)
  async addWorkLog(
    @Context() context: GraphQLContext,
    @Args('input') input: AddWorkLogInput,
  ): Promise<WorkLog> {
    const userId = context.req.user.id;
    return this.workLogService.addWorkLog(userId, input);
  }

  @Mutation(() => WorkLog)
  async updateWorkLog(
    @Context() context: GraphQLContext,
    @Args('input') input: UpdateWorkLogInput,
  ): Promise<WorkLog> {
    const userId = context.req.user.id;
    return this.workLogService.updateWorkLog(userId, input.workLogId, input);
  }

  @Mutation(() => Boolean)
  async deleteWorkLog(
    @Context() context: GraphQLContext,
    @Args('id', { type: () => ID }) id: string,
  ): Promise<boolean> {
    const userId = context.req.user.id;
    return this.workLogService.deleteWorkLog(userId, id);
  }
}
