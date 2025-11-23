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

export interface TaskNotification {
  type: 'TASK_ASSIGNED' | 'TASK_APPROVED' | 'TASK_COMPLETED' | 'TASK_REJECTED';
  taskId: string;
  taskTitle: string;
  message: string;
  priority?: string;
}

export type Notification = CallNotification | TaskNotification;

export interface SocketEvents {
  'notification': (data: Notification) => void;
  'auth': (token: string, callback: (response: AuthResponse) => void) => void;
  'call:response': (data: { callId: string; accept: boolean }) => void;
  'call:initiate': (data: { receiverId: string }) => void;
  'connected_users': (data: string[]) => void;
} 