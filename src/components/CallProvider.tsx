import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { gql, useMutation } from '@apollo/client';
import { Socket } from 'socket.io-client';
import { toast, Toast } from 'react-hot-toast';
import { IoVideocam, IoCopy, IoOpen } from 'react-icons/io5';
import path from 'path';

import CallNotification from './CallNotification';
import { CallNotification as CallNotificationType, SocketEvents } from '../types/socket';
import { useSocket } from '../services/socket';
// import { ipcRenderer } from 'electron';
const { ipcRenderer } = window.require('electron');

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
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [audioSrc, setAudioSrc] = useState<string>('');
  

  // Initialize audio path
  React.useEffect(() => {
    // Request the audio file path from the main process
    ipcRenderer.invoke('get-audio-path').then((audioPath: string) => {
      console.log('[CallProvider] Got audio path:', audioPath);
      setAudioSrc(audioPath);
    }).catch((error: Error) => {
      console.error('[CallProvider] Error getting audio path:', error);
    });
  }, []);

  const stopRinging = useCallback(() => {
    console.log('[CallProvider] Stopping ring tone');
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  }, []);

  const [handleCallResponse] = useMutation(HANDLE_CALL_RESPONSE, {
    onCompleted: (data) => {
      console.log('[CallProvider] Call response mutation completed:', data);
      if (data.handleCallResponse.status === 'ACCEPTED' && data.handleCallResponse.meetingLink) {
        console.log('[CallProvider] Meeting link received:', data.handleCallResponse.meetingLink);
        
        // Show a toast with the meeting link
        toast.custom((t: Toast) => (
          <div
            style={{
              maxWidth: '400px',
              padding: '16px',
              background: 'white',
              borderRadius: '12px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <IoVideocam size={20} color="#22c55e" />
              <span style={{ fontWeight: 500, color: '#111' }}>Meeting Ready</span>
            </div>
            
            <div style={{ 
              display: 'flex',
              gap: '8px'
            }}>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(data.handleCallResponse.meetingLink);
                  toast.success('Meeting link copied to clipboard!');
                }}
                style={{
                  flex: 1,
                  padding: '8px',
                  background: '#f3f4f6',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  color: '#374151',
                  fontSize: '14px',
                  fontWeight: 500,
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#e5e7eb';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#f3f4f6';
                }}
              >
                <IoCopy size={16} />
                <span>Copy Link</span>
              </button>
              
              <button
                onClick={() => {
                  // window.open(data.handleCallResponse.meetingLink, '_blank');

                   ipcRenderer.send('open-external-link', data.handleCallResponse.meetingLink);
            
                  toast.success('Opening meeting in browser...');
                }}
                style={{
                  flex: 1,
                  padding: '8px',
                  background: '#22c55e',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: 500,
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#16a34a';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#22c55e';
                }}
              >
                <IoOpen size={16} />
                <span>Open in Browser</span>
              </button>
            </div>
          </div>
        ), {
          duration: 10000,
          position: 'top-right'
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
      
      // Play ring tone
      if (audioRef.current) {
        console.log('[CallProvider] Attempting to play ring tone');
        audioRef.current.play().catch(error => {
          console.error('[CallProvider] Error playing ring tone:', error);
          // Try to load and play again
          audioRef.current?.load();
          audioRef.current?.play().catch(e => {
            console.error('[CallProvider] Second attempt to play failed:', e);
          });
        });
      } else {
        console.error('[CallProvider] Audio element not initialized');
      }

      // Focus the window
      ipcRenderer.send('focus-window');
      
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

    stopRinging();

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
    })
    .then(() => {
      // Only clear the incoming call after we get a response
      setIncomingCall(null);
    })
    .catch(error => {
      console.error('[CallProvider] GraphQL mutation failed:', {
        error,
        callId: incomingCall.callId,
        errorMessage: error.message,
        graphQLErrors: error.graphQLErrors
      });
      // Reset the waiting state on error
      setIsWaitingForMeetingLink(false);
      // Show error toast
      toast.error('Failed to accept call. Please try again.');
    });

    console.log('[CallProvider] Called handleCallResponse mutation');
  }, [incomingCall, handleCallResponse, stopRinging]);

  const handleRejectCall = useCallback(() => {
    if (!incomingCall) {
      console.log('[CallProvider] Cannot reject call - no incoming call');
      return;
    }

    stopRinging();

    console.log('[CallProvider] Rejecting call:', incomingCall);
    
    // Use GraphQL mutation instead of socket event
    handleCallResponse({
      variables: {
        callId: incomingCall.callId,
        accept: false,
      }
    });

    setIncomingCall(null);
  }, [incomingCall, handleCallResponse, stopRinging]);

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
      {audioSrc && (
        <audio 
          ref={audioRef}
          src={audioSrc}
          loop
          preload="auto"
          style={{ display: 'none' }}
          onError={(e) => console.error('[CallProvider] Audio error:', e)}
          onPlay={() => console.log('[CallProvider] Audio started playing')}
          onCanPlayThrough={() => console.log('[CallProvider] Audio loaded and ready to play')}
        />
      )}
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
          isGeneratingLink={isWaitingForMeetingLink}
        />
      )}
    </CallContext.Provider>
  );
}; 