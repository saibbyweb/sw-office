import { Injectable } from '@nestjs/common';
import { NotificationsGateway } from '../notifications/notifications.gateway';
import { Call, CallStatus } from '../schema/call.schema';
import { v4 as uuidv4 } from 'uuid';
import { User } from 'src/generated-nestjs-typegraphql';
import { TeamsService } from '../teams/teams.service';
import { SocketManagerService } from '../notifications/socket-manager.service';

const CALL_TIMEOUT_MS = 30000; // 30 seconds timeout

@Injectable()
export class CallsService {
  private activeCalls: Map<string, Call> = new Map();
  private callTimeouts: Map<string, NodeJS.Timeout> = new Map();

  constructor(
    private readonly notificationsGateway: NotificationsGateway,
    private readonly teamsService: TeamsService,
    private readonly socketManager: SocketManagerService,
  ) {}

  registerUserSocket(userId: string, socketId: string) {
    this.socketManager.registerUserSocket(userId, socketId);
  }

  removeUserSocket(userId: string) {
    this.socketManager.removeUserSocket(userId);

    // Find and cancel any pending calls initiated by this user
    for (const [callId, call] of this.activeCalls.entries()) {
      if (call.caller.id === userId && call.status === CallStatus.PENDING) {
        // Notify receiver that call was cancelled
        const receiverSocketId = this.socketManager.getUserSocketId(
          call.receiver.id,
        );
        if (receiverSocketId) {
          this.notificationsGateway.sendNotificationToClient(receiverSocketId, {
            type: 'CALL_CANCELLED',
            callId: call.id,
            reason: 'CALLER_DISCONNECTED',
          });
        }

        // Clear timeout and remove call
        const timeout = this.callTimeouts.get(callId);
        if (timeout) {
          clearTimeout(timeout);
          this.callTimeouts.delete(callId);
        }

        call.status = CallStatus.ENDED;
        this.activeCalls.delete(callId);
      }
    }
  }

  initiateCall(callerId: string, receiverId: string): Call {
    const call: Call = {
      id: uuidv4(),
      caller: { id: callerId } as User,
      receiver: { id: receiverId } as User,
      status: CallStatus.PENDING,
      createdAt: new Date(),
    };

    this.activeCalls.set(call.id, call);

    // Set timeout for the call
    const timeout = setTimeout(() => {
      this.handleCallTimeout(call.id);
    }, CALL_TIMEOUT_MS);
    this.callTimeouts.set(call.id, timeout);

    // Get receiver's socket ID
    const receiverSocketId = this.socketManager.getUserSocketId(receiverId);
    if (receiverSocketId) {
      this.notificationsGateway.sendNotificationToClient(receiverSocketId, {
        type: 'INCOMING_CALL',
        callId: call.id,
        callerId,
      });
    }

    return call;
  }

  private handleCallTimeout(callId: string) {
    const call = this.activeCalls.get(callId);
    if (call && call.status === CallStatus.PENDING) {
      call.status = CallStatus.REJECTED;

      // Notify caller that call timed out
      const callerSocketId = this.socketManager.getUserSocketId(call.caller.id);
      if (callerSocketId) {
        this.notificationsGateway.sendNotificationToClient(callerSocketId, {
          type: 'CALL_TIMEOUT',
          callId: call.id,
        });
      }

      this.activeCalls.delete(callId);
      this.callTimeouts.delete(callId);
    }
  }

  async handleCallResponse(
    callId: string,
    receiverId: string,
    accept: boolean,
  ): Promise<Call> {
    // Clear the timeout since we got a response
    const timeout = this.callTimeouts.get(callId);
    if (timeout) {
      clearTimeout(timeout);
      this.callTimeouts.delete(callId);
    }

    const call = this.activeCalls.get(callId);
    if (!call || call.receiver.id !== receiverId) {
      throw new Error('Call not found or unauthorized');
    }

    if (accept) {
      // Create Teams meeting
      const startTime = new Date().toISOString();
      const endTime = new Date(Date.now() + 30 * 60000).toISOString(); // 30 minutes from now
      const meeting = await this.teamsService.createOnlineMeeting(
        'Quick Call',
        startTime,
        endTime,
        call.caller.id,
      );

      call.status = CallStatus.ACCEPTED;
      call.meetingLink = meeting.joinUrl;
      call.answeredAt = new Date();
    } else {
      call.status = CallStatus.REJECTED;
      call.answeredAt = new Date();
    }

    // Notify caller of the response
    const callerSocketId = this.socketManager.getUserSocketId(call.caller.id);
    if (callerSocketId) {
      this.notificationsGateway.sendNotificationToClient(callerSocketId, {
        type: 'CALL_RESPONSE',
        callId: call.id,
        accepted: accept,
        meetingLink: call.meetingLink,
      });
    }

    this.activeCalls.set(callId, call);
    return call;
  }

  endCall(callId: string, userId: string): Call {
    // Clear any existing timeout
    const timeout = this.callTimeouts.get(callId);
    if (timeout) {
      clearTimeout(timeout);
      this.callTimeouts.delete(callId);
    }

    const call = this.activeCalls.get(callId);
    if (!call || (call.caller.id !== userId && call.receiver.id !== userId)) {
      throw new Error('Call not found or unauthorized');
    }

    call.status = CallStatus.ENDED;

    // Notify both parties
    const otherPartyId =
      call.caller.id === userId ? call.receiver.id : call.caller.id;
    const otherPartySocketId = this.socketManager.getUserSocketId(otherPartyId);

    if (otherPartySocketId) {
      this.notificationsGateway.sendNotificationToClient(otherPartySocketId, {
        type: 'CALL_ENDED',
        callId: call.id,
      });
    }

    this.activeCalls.delete(callId);
    return call;
  }

  cancelCall(callId: string, callerId: string): Call {
    const call = this.activeCalls.get(callId);
    if (!call || call.caller.id !== callerId) {
      throw new Error('Call not found or unauthorized');
    }

    if (call.status !== CallStatus.PENDING) {
      throw new Error('Can only cancel pending calls');
    }

    call.status = CallStatus.ENDED;

    // Notify receiver that call was cancelled
    const receiverSocketId = this.socketManager.getUserSocketId(
      call.receiver.id,
    );
    if (receiverSocketId) {
      this.notificationsGateway.sendNotificationToClient(receiverSocketId, {
        type: 'CALL_CANCELLED',
        callId: call.id,
      });
    }

    // Clear any existing timeout
    const timeout = this.callTimeouts.get(callId);
    if (timeout) {
      clearTimeout(timeout);
      this.callTimeouts.delete(callId);
    }

    this.activeCalls.delete(callId);
    return call;
  }
}
