import { Resolver, Mutation, Args, ID } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Break, StartBreakInput } from '../schema/break.types';
import { BreakService } from '../services/break.service';

@Resolver(() => Break)
@UseGuards(JwtGuard)
export class BreakResolver {
  constructor(private readonly breakService: BreakService) {}

  @Mutation(() => Break)
  async startBreak(
    @CurrentUser() userId: string,
    @Args('sessionId', { type: () => ID }) sessionId: string,
    @Args('input') input: StartBreakInput,
  ): Promise<Break> {
    return this.breakService.startBreak(userId, sessionId, input);
  }

  @Mutation(() => Break)
  async endBreak(
    @CurrentUser() userId: string,
    @Args('id', { type: () => ID }) id: string,
  ): Promise<Break> {
    return this.breakService.endBreak(userId, id);
  }
}
