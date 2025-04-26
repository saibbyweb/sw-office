import { Resolver, Mutation, Args, ID, Context, Query } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { Break } from '../generated-nestjs-typegraphql';
import { StartBreakInput } from '../types/break.types';
import { BreakService } from '../services/break.service';
import { GraphQLContext } from 'src/users/users.resolver';

@Resolver(() => Break)
export class BreakResolver {
  constructor(private readonly breakService: BreakService) {}

  @Mutation(() => Break)
  @UseGuards(JwtGuard)
  async startBreak(
    @Context() context: GraphQLContext,
    @Args('input') input: StartBreakInput,
  ): Promise<Break> {
    const userId = context.req.user.id;
    return this.breakService.startBreak(userId, input);
  }

  @UseGuards(JwtGuard)
  @Mutation(() => Break)
  async endBreak(
    @Context() context: GraphQLContext,
    @Args('breakId', { type: () => ID }) breakId: string,
  ): Promise<Break> {
    const userId = context.req.user.id;
    return this.breakService.endBreak(userId, breakId);
  }

  @Query(() => Number)
  @UseGuards(JwtGuard)
  getBreakNotificationDuration(): number {
    return this.breakService.getBreakNotificationDuration();
  }
}
