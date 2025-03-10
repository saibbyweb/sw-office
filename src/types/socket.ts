export interface AuthResponse {
  status: string;
  message?: string;
}

export interface CallNotification {
  type: 'INCOMING_CALL' | 'CALL_RESPONSE' | 'CALL_ENDED' | 'CALL_TIMEOUT' | 'CALL_CANCELLED' | 'CALL_ACCEPTED';
  callId: string;
  callerId?: string;
  accepted?: boolean;
  meetingLink?: string;
  reason?: string;
}

export interface SocketEvents {
  'notification': (data: CallNotification) => void;
  'auth': (token: string, callback: (response: AuthResponse) => void) => void;
  'call:response': (data: { callId: string; accept: boolean }) => void;
  'call:initiate': (data: { receiverId: string }) => void;
  'connected_users': (data: string[]) => void;
} 