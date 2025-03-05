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
    console.log(
      `[CallsService] Registering socket for user ${userId} with socket ID ${socketId}`,
    );
    this.socketManager.registerUserSocket(userId, socketId);
  }

  removeUserSocket(userId: string) {
    console.log(`[CallsService] Removing socket for user ${userId}`);
    this.socketManager.removeUserSocket(userId);

    // Find and cancel any pending calls initiated by this user
    for (const [callId, call] of this.activeCalls.entries()) {
      if (call.caller.id === userId && call.status === CallStatus.PENDING) {
        console.log(
          `[CallsService] Cancelling pending call ${callId} due to caller disconnect`,
        );

        // Notify receiver that call was cancelled
        const receiverSocketId = this.socketManager.getUserSocketId(
          call.receiver.id,
        );
        if (receiverSocketId) {
          console.log(
            `[CallsService] Notifying receiver ${call.receiver.id} about call cancellation`,
          );
          this.notificationsGateway.sendNotificationToClient(receiverSocketId, {
            type: 'CALL_CANCELLED',
            callId: call.id,
            reason: 'CALLER_DISCONNECTED',
          });
        } else {
          console.log(
            `[CallsService] Could not find socket for receiver ${call.receiver.id}`,
          );
        }

        // Clear timeout and remove call
        const timeout = this.callTimeouts.get(callId);
        if (timeout) {
          console.log(`[CallsService] Clearing timeout for call ${callId}`);
          clearTimeout(timeout);
          this.callTimeouts.delete(callId);
        }

        call.status = CallStatus.ENDED;
        this.activeCalls.delete(callId);
      }
    }
  }

  initiateCall(callerId: string, receiverId: string): Call {
    console.log(
      `[CallsService] Initiating call from ${callerId} to ${receiverId}`,
    );

    // Log all connected users for debugging
    this.socketManager.logAllConnectedUsers();

    // Check if receiver has an authenticated socket connection
    const receiverHasSocket =
      this.socketManager.hasAuthenticatedSocket(receiverId);
    if (!receiverHasSocket) {
      console.log(
        `[CallsService] Cannot initiate call - receiver ${receiverId} is not connected`,
      );
      throw new Error('Cannot initiate call - receiver is not connected');
    }

    const call: Call = {
      id: uuidv4(),
      caller: { id: callerId } as User,
      receiver: { id: receiverId } as User,
      status: CallStatus.PENDING,
      createdAt: new Date(),
    };

    console.log(`[CallsService] Created new call with ID ${call.id}`);
    this.activeCalls.set(call.id, call);

    // Set timeout for the call
    console.log(
      `[CallsService] Setting timeout for call ${call.id} (${CALL_TIMEOUT_MS}ms)`,
    );
    const timeout = setTimeout(() => {
      this.handleCallTimeout(call.id);
    }, CALL_TIMEOUT_MS);
    this.callTimeouts.set(call.id, timeout);

    // Get receiver's socket ID and send notification
    const receiverSocketId = this.socketManager.getUserSocketId(receiverId);
    if (!receiverSocketId) {
      // This should never happen since we checked hasAuthenticatedSocket above
      console.error(
        `[CallsService] Critical error - receiver socket not found after authentication check`,
      );
      throw new Error('Internal error - receiver socket not found');
    }

    console.log(
      `[CallsService] Sending incoming call notification to receiver ${receiverId}`,
    );
    this.notificationsGateway.sendNotificationToClient(receiverSocketId, {
      type: 'INCOMING_CALL',
      callId: call.id,
      callerId,
    });

    return call;
  }

  private handleCallTimeout(callId: string) {
    console.log(`[CallsService] Call ${callId} timed out`);
    const call = this.activeCalls.get(callId);
    if (call && call.status === CallStatus.PENDING) {
      console.log(
        `[CallsService] Setting call ${callId} status to REJECTED due to timeout`,
      );
      call.status = CallStatus.REJECTED;

      // Notify caller that call timed out
      const callerSocketId = this.socketManager.getUserSocketId(call.caller.id);
      if (callerSocketId) {
        console.log(
          `[CallsService] Notifying caller ${call.caller.id} about call timeout`,
        );
        this.notificationsGateway.sendNotificationToClient(callerSocketId, {
          type: 'CALL_TIMEOUT',
          callId: call.id,
        });
      } else {
        console.log(
          `[CallsService] Could not find socket for caller ${call.caller.id}`,
        );
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
    console.log(
      `[CallsService] Handling call response for call ${callId} from receiver ${receiverId} (accept: ${accept})`,
    );

    // Clear the timeout since we got a response
    const timeout = this.callTimeouts.get(callId);
    if (timeout) {
      console.log(`[CallsService] Clearing timeout for call ${callId}`);
      clearTimeout(timeout);
      this.callTimeouts.delete(callId);
    }

    const call = this.activeCalls.get(callId);
    if (!call || call.receiver.id !== receiverId) {
      console.log(`[CallsService] Call not found or unauthorized: ${callId}`);
      throw new Error('Call not found or unauthorized');
    }

    if (accept) {
      console.log(
        `[CallsService] Call ${callId} accepted, creating Teams meeting`,
      );
      // Create Teams meeting
      const startTime = new Date().toISOString();
      const endTime = new Date(Date.now() + 30 * 60000).toISOString(); // 30 minutes from now
      try {
        const meeting = await this.teamsService.createOnlineMeeting(
          'Quick Call',
          startTime,
          endTime,
          call.caller.id,
        );
        console.log(
          `[CallsService] Teams meeting created for call ${callId} with join URL: ${meeting.joinUrl}`,
        );

        call.status = CallStatus.ACCEPTED;
        call.meetingLink = meeting.joinUrl;
        call.answeredAt = new Date();
      } catch (error) {
        console.error(
          `[CallsService] Error creating Teams meeting for call ${callId}:`,
          error,
        );
        throw error;
      }
    } else {
      console.log(`[CallsService] Call ${callId} rejected by receiver`);
      call.status = CallStatus.REJECTED;
      call.answeredAt = new Date();
    }

    // Notify caller of the response
    const callerSocketId = this.socketManager.getUserSocketId(call.caller.id);
    if (callerSocketId) {
      console.log(
        `[CallsService] Notifying caller ${call.caller.id} about call response`,
      );
      this.notificationsGateway.sendNotificationToClient(callerSocketId, {
        type: 'CALL_RESPONSE',
        callId: call.id,
        accepted: accept,
        meetingLink: call.meetingLink,
      });
    } else {
      console.log(
        `[CallsService] Could not find socket for caller ${call.caller.id}`,
      );
    }

    this.activeCalls.set(callId, call);
    return call;
  }

  endCall(callId: string, userId: string): Call {
    console.log(`[CallsService] Ending call ${callId} by user ${userId}`);

    // Clear any existing timeout
    const timeout = this.callTimeouts.get(callId);
    if (timeout) {
      console.log(`[CallsService] Clearing timeout for call ${callId}`);
      clearTimeout(timeout);
      this.callTimeouts.delete(callId);
    }

    const call = this.activeCalls.get(callId);
    if (!call || (call.caller.id !== userId && call.receiver.id !== userId)) {
      console.log(`[CallsService] Call not found or unauthorized: ${callId}`);
      throw new Error('Call not found or unauthorized');
    }

    call.status = CallStatus.ENDED;

    // Notify both parties
    const otherPartyId =
      call.caller.id === userId ? call.receiver.id : call.caller.id;
    const otherPartySocketId = this.socketManager.getUserSocketId(otherPartyId);

    if (otherPartySocketId) {
      console.log(
        `[CallsService] Notifying other party ${otherPartyId} about call end`,
      );
      this.notificationsGateway.sendNotificationToClient(otherPartySocketId, {
        type: 'CALL_ENDED',
        callId: call.id,
      });
    } else {
      console.log(
        `[CallsService] Could not find socket for other party ${otherPartyId}`,
      );
    }

    this.activeCalls.delete(callId);
    return call;
  }

  cancelCall(callId: string, callerId: string): Call {
    console.log(
      `[CallsService] Cancelling call ${callId} by caller ${callerId}`,
    );

    const call = this.activeCalls.get(callId);
    if (!call || call.caller.id !== callerId) {
      console.log(`[CallsService] Call not found or unauthorized: ${callId}`);
      throw new Error('Call not found or unauthorized');
    }

    if (call.status !== CallStatus.PENDING) {
      console.log(
        `[CallsService] Cannot cancel call ${callId} - not in PENDING state`,
      );
      throw new Error('Can only cancel pending calls');
    }

    call.status = CallStatus.ENDED;

    // Notify receiver that call was cancelled
    const receiverSocketId = this.socketManager.getUserSocketId(
      call.receiver.id,
    );
    if (receiverSocketId) {
      console.log(
        `[CallsService] Notifying receiver ${call.receiver.id} about call cancellation`,
      );
      this.notificationsGateway.sendNotificationToClient(receiverSocketId, {
        type: 'CALL_CANCELLED',
        callId: call.id,
      });
    } else {
      console.log(
        `[CallsService] Could not find socket for receiver ${call.receiver.id}`,
      );
    }

    // Clear any existing timeout
    const timeout = this.callTimeouts.get(callId);
    if (timeout) {
      console.log(`[CallsService] Clearing timeout for call ${callId}`);
      clearTimeout(timeout);
      this.callTimeouts.delete(callId);
    }

    this.activeCalls.delete(callId);
    return call;
  }
}
