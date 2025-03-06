import { Args, Mutation, Resolver, Context } from '@nestjs/graphql';
import { CallsService } from './calls.service';
import { Call } from '../schema/call.schema';
import { UseGuards } from '@nestjs/common';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { GraphQLContext } from 'src/users/users.resolver';

@Resolver(() => Call)
@UseGuards(JwtGuard)
export class CallsResolver {
  constructor(private readonly callsService: CallsService) {}

  @Mutation(() => Call)
  initiateCall(
    @Context() context: GraphQLContext,
    @Args('receiverId') receiverId: string,
  ) {
    const userId = context.req.user.id;
    console.log(userId, receiverId, '--initiate call');
    return this.callsService.initiateCall(userId, receiverId);
  }

  @Mutation(() => Call)
  testInitiateCall(
    @Args('callerId') callerId: string,
    @Args('receiverId') receiverId: string,
  ) {
    console.log(
      `[CallsResolver] Test initiating call from ${callerId} to ${receiverId}`,
    );
    return this.callsService.initiateCall(callerId, receiverId);
  }

  @Mutation(() => Call)
  async handleCallResponse(
    @Context() context: GraphQLContext,
    @Args('callId') callId: string,
    @Args('accept') accept: boolean,
  ) {
    const userId = context.req.user.id;
    return await this.callsService.handleCallResponse(callId, userId, accept);
  }

  @Mutation(() => Call)
  endCall(@Context() context: GraphQLContext, @Args('callId') callId: string) {
    const userId = context.req.user.id;
    return this.callsService.endCall(callId, userId);
  }

  @Mutation(() => Call)
  cancelCall(
    @Context() context: GraphQLContext,
    @Args('callId') callId: string,
  ) {
    const userId = context.req.user.id;
    return this.callsService.cancelCall(callId, userId);
  }
}
