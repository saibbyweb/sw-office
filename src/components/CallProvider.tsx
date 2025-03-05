import React, { createContext, useContext, useState, useCallback } from 'react';

import CallNotification from './CallNotification';
import { CallNotification as CallNotificationType } from '../types/socket';
import { useSocket } from '../services/socket';

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
        type: notification.type
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
      socket.off('notification');
    };
  }, [socket, isAuthenticated]);

  // Log state changes
  React.useEffect(() => {
    console.log('[CallProvider] State updated:', {
      isConnected,
      isAuthenticated,
      socketId: socket?.id,
      hasIncomingCall: !!incomingCall
    });
  }, [isConnected, isAuthenticated, socket, incomingCall]);

  const handleAcceptCall = useCallback(() => {
    if (!incomingCall || !socket || !isAuthenticated) {
      console.log('[CallProvider] Cannot accept call - missing data:', { incomingCall, hasSocket: !!socket, isAuthenticated });
      return;
    }

    console.log('[CallProvider] Accepting call:', incomingCall);
    // Emit call response
    socket.emit('call:response', {
      callId: incomingCall.callId,
      accept: true,
    });

    setIncomingCall(null);
  }, [incomingCall, socket, isAuthenticated]);

  const handleRejectCall = useCallback(() => {
    if (!incomingCall || !socket || !isAuthenticated) {
      console.log('[CallProvider] Cannot reject call - missing data:', { incomingCall, hasSocket: !!socket, isAuthenticated });
      return;
    }

    console.log('[CallProvider] Rejecting call:', incomingCall);
    // Emit call response
    socket.emit('call:response', {
      callId: incomingCall.callId,
      accept: false,
    });

    setIncomingCall(null);
  }, [incomingCall, socket, isAuthenticated]);

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