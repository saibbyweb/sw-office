import { Resolver, Mutation, Args, ID } from '@nestjs/graphql';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { WorkLog } from '../generated-nestjs-typegraphql';
import { AddWorkLogInput, UpdateWorkLogInput } from '../types/worklog.types';
import { WorkLogService } from '../services/worklog.service';

@Resolver(() => WorkLog)
// @UseGuards(JwtGuard)
export class WorkLogResolver {
  constructor(private readonly workLogService: WorkLogService) {}

  @Mutation(() => WorkLog)
  async addWorkLog(
    @CurrentUser() userId: string,
    @Args('input') input: AddWorkLogInput,
  ): Promise<WorkLog> {
    return this.workLogService.addWorkLog(userId, input);
  }

  @Mutation(() => WorkLog)
  async updateWorkLog(
    @CurrentUser() userId: string,
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateWorkLogInput,
  ): Promise<WorkLog> {
    return this.workLogService.updateWorkLog(userId, id, input);
  }

  @Mutation(() => Boolean)
  async deleteWorkLog(
    @CurrentUser() userId: string,
    @Args('id', { type: () => ID }) id: string,
  ): Promise<boolean> {
    return this.workLogService.deleteWorkLog(userId, id);
  }
}
