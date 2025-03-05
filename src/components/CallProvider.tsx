import React, { createContext, useContext, useState, useCallback } from 'react';
import { gql, useMutation } from '@apollo/client';
import { Socket } from 'socket.io-client';
import { toast, Toast } from 'react-hot-toast';

import CallNotification from './CallNotification';
import { CallNotification as CallNotificationType, SocketEvents } from '../types/socket';
import { useSocket } from '../services/socket';

const HANDLE_CALL_RESPONSE = gql`
  mutation HandleCallResponse($callId: String!, $accept: Boolean!) {
    handleCallResponse(callId: $callId, accept: $accept) {
      id
      status
      meetingLink
    }
  }
`;

interface CallContextType {
  initiateCall: (receiverId: string) => void;
  isConnected: boolean;
  isAuthenticated: boolean;
}

const CallContext = createContext<CallContextType | null>(null);

export const useCall = () => {
  const context = useContext(CallContext);
  if (!context) {
    throw new Error('useCall must be used within a CallProvider');
  }
  return context;
};

interface IncomingCall {
  callId: string;
  callerId: string;
}

export const CallProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { socket, isConnected, isAuthenticated } = useSocket();
  const [incomingCall, setIncomingCall] = useState<IncomingCall | null>(null);
  const [isWaitingForMeetingLink, setIsWaitingForMeetingLink] = useState(false);

  const [handleCallResponse] = useMutation(HANDLE_CALL_RESPONSE, {
    onCompleted: (data) => {
      console.log('[CallProvider] Call response mutation completed:', data);
      if (data.handleCallResponse.status === 'ACCEPTED' && data.handleCallResponse.meetingLink) {
        console.log('[CallProvider] Meeting link received:', data.handleCallResponse.meetingLink);
        // Show a toast with the meeting link
        toast((t: Toast) => (
          <div>
            <p>Meeting link ready:</p>
            <div style={{ 
              marginTop: '8px', 
              padding: '8px', 
              background: '#f0f0f0', 
              borderRadius: '4px',
              wordBreak: 'break-all'
            }}>
              {data.handleCallResponse.meetingLink}
            </div>
            <button 
              onClick={() => {
                navigator.clipboard.writeText(data.handleCallResponse.meetingLink);
                toast.success('Meeting link copied to clipboard!');
              }}
              style={{
                marginTop: '8px',
                padding: '4px 8px',
                background: '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Copy Link
            </button>
          </div>
        ), {
          duration: 10000, // Show for 10 seconds
          style: {
            minWidth: '300px'
          }
        });
      }
      setIsWaitingForMeetingLink(false);
    },
    onError: (error) => {
      console.error('[CallProvider] Call response mutation error:', error);
      setIsWaitingForMeetingLink(false);
      toast.error('Failed to get meeting link. Please try again.');
    }
  });

  // Handle incoming call notification
  React.useEffect(() => {
    if (!socket || !isAuthenticated) {
      console.log('[CallProvider] Socket not available or not authenticated', {
        hasSocket: !!socket,
        socketId: socket?.id,
        isAuthenticated
      });
      return;
    }

    console.log('[CallProvider] Setting up socket listeners for socket:', socket.id);

    // Debug: Log all socket events
    const debugSocketEvents = (eventName: keyof SocketEvents) => {
      socket.on(eventName, (...args: any[]) => {
        console.log(`[CallProvider] Socket event '${eventName}':`, ...args);
      });
    };

    // Debug: Listen to all possible socket events
    const events: (keyof SocketEvents)[] = ['notification'];
    events.forEach(debugSocketEvents);

    // Add connect/disconnect listeners separately
    socket.on('connect', () => {
      console.log('[CallProvider] Socket connected:', socket.id);
    });

    socket.on('disconnect', () => {
      console.log('[CallProvider] Socket disconnected');
    });

    const handleIncomingCall = (data: { callId: string; callerId: string }) => {
      console.log('[CallProvider] Received incoming call:', {
        ...data,
        socketId: socket.id,
        currentIncomingCall: incomingCall
      });
      setIncomingCall(data);
    };

    socket.on('notification', (notification: CallNotificationType) => {
      console.log('[CallProvider] Received notification:', {
        ...notification,
        socketId: socket.id,
        type: notification.type,
        isWaitingForMeetingLink,
        rawData: JSON.stringify(notification)
      });
      
      if (notification.type === 'INCOMING_CALL' && notification.callerId) {
        handleIncomingCall({
          callId: notification.callId,
          callerId: notification.callerId,
        });
      }
    });

    return () => {
      console.log('[CallProvider] Cleaning up socket listeners for socket:', socket.id);
      
      // Clean up notification listeners
      events.forEach(event => {
        socket.off(event);
      });

      // Clean up connect/disconnect listeners
      socket.off('connect');
      socket.off('disconnect');
    };
  }, [socket, isAuthenticated, isWaitingForMeetingLink]);

  // Log state changes
  React.useEffect(() => {
    console.log('[CallProvider] State updated:', {
      isConnected,
      isAuthenticated,
      socketId: socket?.id,
      hasIncomingCall: !!incomingCall,
      isWaitingForMeetingLink
    });
  }, [isConnected, isAuthenticated, socket, incomingCall, isWaitingForMeetingLink]);

  const handleAcceptCall = useCallback(() => {
    if (!incomingCall) {
      console.log('[CallProvider] Cannot accept call - no incoming call');
      return;
    }

    // Check authentication before making the mutation
    const token = localStorage.getItem('authToken');
    console.log('[CallProvider] Accepting call with auth state:', {
      incomingCall,
      isAuthenticated,
      hasToken: !!token,
      tokenPreview: token ? `${token.substring(0, 20)}...` : null
    });
    
    if (!token) {
      console.error('[CallProvider] No auth token found, cannot accept call');
      return;
    }
    
    setIsWaitingForMeetingLink(true);
    
    // Use GraphQL mutation instead of socket event
    handleCallResponse({
      variables: {
        callId: incomingCall.callId,
        accept: true,
      },
      context: {
        // Ensure we're sending the auth token
        headers: {
          authorization: `Bearer ${token}`
        }
      }
    }).catch(error => {
      console.error('[CallProvider] GraphQL mutation failed:', {
        error,
        callId: incomingCall.callId,
        errorMessage: error.message,
        graphQLErrors: error.graphQLErrors
      });
    });

    console.log('[CallProvider] Called handleCallResponse mutation');
    setIncomingCall(null);
  }, [incomingCall, handleCallResponse]);

  const handleRejectCall = useCallback(() => {
    if (!incomingCall) {
      console.log('[CallProvider] Cannot reject call - no incoming call');
      return;
    }

    console.log('[CallProvider] Rejecting call:', incomingCall);
    
    // Use GraphQL mutation instead of socket event
    handleCallResponse({
      variables: {
        callId: incomingCall.callId,
        accept: false,
      }
    });

    setIncomingCall(null);
  }, [incomingCall, handleCallResponse]);

  const initiateCall = useCallback((receiverId: string) => {
    if (!socket || !isAuthenticated) {
      console.log('[CallProvider] Cannot initiate call - socket not available or not authenticated:', { hasSocket: !!socket, isAuthenticated });
      return;
    }

    console.log('[CallProvider] Initiating call to:', receiverId);
    // Emit call initiation
    socket.emit('call:initiate', {
      receiverId,
    });
  }, [socket, isAuthenticated]);

  console.log('[CallProvider] Current state:', { isConnected, isAuthenticated, hasSocket: !!socket, incomingCall });

  // Add debug log for render
  console.log('[CallProvider] Rendering with state:', {
    isConnected,
    isAuthenticated,
    hasSocket: !!socket,
    hasIncomingCall: !!incomingCall,
    incomingCallData: incomingCall
  });

  const showingNotification = !!incomingCall;
  if (showingNotification) {
    console.log('[CallProvider] About to render CallNotification component');
  }

  return (
    <CallContext.Provider value={{ initiateCall, isConnected, isAuthenticated }}>
      {children}
      {/* Debug element */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        padding: '8px',
        background: 'red',
        color: 'white',
        zIndex: 999998
      }}>
        Debug: {incomingCall ? 'Incoming Call' : 'No Call'}
      </div>
      {/* Only show notification when there's an incoming call */}
      {incomingCall && (
        <CallNotification
          callerId={incomingCall.callerId}
          onAccept={handleAcceptCall}
          onReject={handleRejectCall}
        />
      )}
    </CallContext.Provider>
  );
}; 