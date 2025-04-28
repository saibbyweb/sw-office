import {
  Resolver,
  Mutation,
  Args,
  ID,
  Context,
  Query,
  ObjectType,
  Field,
} from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { Break } from '../generated-nestjs-typegraphql';
import { StartBreakInput } from '../types/break.types';
import { BreakService } from '../services/break.service';
import { GraphQLContext } from 'src/users/users.resolver';

@ObjectType()
export class NotificationConfig {
  @Field()
  durationInSeconds: number;

  @Field()
  title: string;

  @Field()
  message: string;
}

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

  @Query(() => NotificationConfig)
  @UseGuards(JwtGuard)
  getBreakNotificationConfig(): NotificationConfig {
    return this.breakService.getBreakNotificationConfig();
  }

  @Query(() => NotificationConfig)
  @UseGuards(JwtGuard)
  getWorkLogNotificationConfig(): NotificationConfig {
    return this.breakService.getWorkLogNotificationConfig();
  }
}
