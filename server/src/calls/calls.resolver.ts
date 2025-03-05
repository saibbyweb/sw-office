import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { CallsService } from './calls.service';
import { Call } from '../schema/call.schema';
import { UseGuards } from '@nestjs/common';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from 'src/generated-nestjs-typegraphql';

@Resolver(() => Call)
@UseGuards(JwtGuard)
export class CallsResolver {
  constructor(private readonly callsService: CallsService) {}

  @Mutation(() => Call)
  async initiateCall(
    @CurrentUser() user: User,
    @Args('receiverId') receiverId: string,
  ) {
    return this.callsService.initiateCall(user.id, receiverId);
  }

  @Mutation(() => Call)
  async testInitiateCall(
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
    @CurrentUser() user: User,
    @Args('callId') callId: string,
    @Args('accept') accept: boolean,
  ) {
    return this.callsService.handleCallResponse(callId, user.id, accept);
  }

  @Mutation(() => Call)
  async endCall(@CurrentUser() user: User, @Args('callId') callId: string) {
    return this.callsService.endCall(callId, user.id);
  }

  @Mutation(() => Call)
  async cancelCall(@CurrentUser() user: User, @Args('callId') callId: string) {
    return this.callsService.cancelCall(callId, user.id);
  }
}
