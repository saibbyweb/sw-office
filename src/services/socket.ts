import { useEffect, useState } from 'react';
import io, { Socket } from 'socket.io-client';
import { AuthResponse, SocketEvents } from '../types/socket';

interface SocketHook {
  socket: Socket<SocketEvents> | null;
  isConnected: boolean;
  isAuthenticated: boolean;
}

let socket: Socket<SocketEvents> | null = null;

export const initSocket = () => {
  if (!socket) {
    console.log('[Socket] Initializing new socket connection');
    socket = io('http://localhost:3000', {
      transports: ['websocket'],
      autoConnect: false, // Don't connect automatically
    });
  } else {
    console.log('[Socket] Reusing existing socket connection');
  }
  
  // Always connect the socket when initSocket is called
  if (!socket.connected) {
    console.log('[Socket] Connecting socket');
    socket.connect();
  }
  
  return socket;
};

export const useSocket = (): SocketHook => {
  const [isConnected, setIsConnected] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [socketInstance, setSocketInstance] = useState<Socket<SocketEvents> | null>(null);

  useEffect(() => {
    const newSocket = initSocket();
    setSocketInstance(newSocket);
    
    console.log('[Socket] Setting up socket in useSocket', {
      existingSocket: !!newSocket,
      existingSocketId: newSocket?.id,
      isConnected: newSocket?.connected
    });

    const onConnect = () => {
      console.log('[Socket] Connected to server', {
        socketId: newSocket.id,
        previouslyAuthenticated: isAuthenticated
      });
      setIsConnected(true);
      setIsAuthenticated(false); // Reset authentication state on new connection

      // Send auth token after connection
      const token = localStorage.getItem('authToken');
      if (token) {
        console.log('[Socket] Authenticating socket connection', {
          socketId: newSocket.id,
          tokenPreview: token.substring(0, 20) + '...'
        });
        newSocket.emit('auth', token, (response: AuthResponse) => {
          console.log('[Socket] Received auth response:', {
            ...response,
            socketId: newSocket.id
          });
          if (response.status === 'authenticated') {
            console.log('[Socket] Authentication successful for socket:', newSocket.id);
            setIsAuthenticated(true);
          } else {
            console.error('[Socket] Authentication failed:', {
              socketId: newSocket.id,
              error: response.message
            });
            setIsAuthenticated(false);
            newSocket.disconnect();
          }
        });
      } else {
        console.warn('[Socket] No auth token found in localStorage for socket:', newSocket.id);
        setIsAuthenticated(false);
      }
    };

    const onDisconnect = () => {
      console.log('[Socket] Disconnected from server', {
        socketId: newSocket.id,
        wasAuthenticated: isAuthenticated
      });
      setIsConnected(false);
      setIsAuthenticated(false);
    };

    const onConnectError = (error: Error) => {
      console.error('[Socket] Connection error:', {
        socketId: newSocket.id,
        error: error.message
      });
      setIsAuthenticated(false);
    };

    newSocket.on('connect', onConnect);
    newSocket.on('disconnect', onDisconnect);
    newSocket.on('connect_error', onConnectError);

    // Connect only when component mounts
    console.log('[Socket] Initiating connection');
    newSocket.connect();

    return () => {
      console.log('[Socket] Cleaning up socket listeners', {
        socketId: newSocket.id,
        isConnected: newSocket.connected,
        isAuthenticated
      });
      newSocket.off('connect', onConnect);
      newSocket.off('disconnect', onDisconnect);
      newSocket.off('connect_error', onConnectError);
    };
  }, []);

  return { socket: socketInstance, isConnected, isAuthenticated };
}; 