import React, { useEffect, useState, useCallback } from 'react';
import styled from 'styled-components';
import { Wifi, WifiOff, RefreshCw } from 'react-feather';
import { notificationService } from '../services/NotificationService';
import { useSocket } from '../services/socket';

const StatusContainer = styled.div`
  position: fixed;
  bottom: 10px;
  right: 10px;
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 8px;
  border-radius: 4px;
  background: ${props => props.theme.colors?.background || '#ffffff'};
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  z-index: 1000;
`;

const StatusDot = styled.div<{ isConnected: boolean }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: ${props => props.isConnected ? '#4CAF50' : '#f44336'};
  margin-right: 4px;
`;

const StatusText = styled.span`
  font-size: 12px;
  color: ${props => props.theme.colors?.text || '#333333'};
`;

const SocketId = styled.span`
  font-size: 10px;
  color: ${props => props.theme.colors?.secondary || '#666666'};
  margin-left: 8px;
`;

const ReconnectButton = styled.button<{ isReconnecting: boolean }>`
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  margin-left: 8px;
  background-color: ${props => props.theme.colors?.primary || '#007bff'};
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 11px;
  cursor: ${props => props.isReconnecting ? 'not-allowed' : 'pointer'};
  opacity: ${props => props.isReconnecting ? 0.6 : 1};
  transition: all 0.2s ease;

  &:hover {
    opacity: ${props => props.isReconnecting ? 0.6 : 0.8};
  }

  svg {
    animation: ${props => props.isReconnecting ? 'spin 1s linear infinite' : 'none'};
  }

  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
`;

export const ConnectionStatus: React.FC = () => {
  const [isConnected, setIsConnected] = useState(false);
  const { socket } = useSocket();
  const [socketId, setSocketId] = useState<string>('');
  const [isReconnecting, setIsReconnecting] = useState(false);

  const handleReconnect = useCallback(() => {
    if (isReconnecting) return;

    console.log('[ConnectionStatus] Attempting to reconnect...');
    setIsReconnecting(true);

    // First disconnect completely, then reconnect
    // This is what happens at app startup
    notificationService.disconnect();

    // Small delay to ensure clean disconnection
    setTimeout(() => {
      notificationService.connect();

      // Set a timeout to stop the reconnecting state if connection doesn't succeed
      setTimeout(() => {
        if (!socket?.connected) {
          console.log('[ConnectionStatus] Reconnection attempt timed out');
          setIsReconnecting(false);
        }
      }, 5000);
    }, 100);
  }, [isReconnecting, socket]);

  useEffect(() => {
    const handleConnect = () => {
      setIsConnected(true);
      setIsReconnecting(false);
      if (socket) {
        console.log('[ConnectionStatus] Socket connected with ID:', socket.id);
        setSocketId(socket.id || '');
      }
    };

    const handleDisconnect = () => {
      console.log('[ConnectionStatus] Socket disconnected');
      setIsConnected(false);
      setSocketId('');
    };

    notificationService.onConnectionChange(handleConnect, handleDisconnect);

    // Set initial socket ID if already connected
    if (socket?.connected) {
      console.log('[ConnectionStatus] Initial socket ID:', socket.id);
      setSocketId(socket.id || '');
    }

    return () => {
      notificationService.offConnectionChange(handleConnect, handleDisconnect);
    };
  }, [socket]);

  // Auto-reconnect when disconnected
  useEffect(() => {
    if (!isConnected && !isReconnecting) {
      console.log('[ConnectionStatus] Disconnected, setting up auto-reconnect...');
      const reconnectInterval = setInterval(() => {
        console.log('[ConnectionStatus] Auto-reconnect attempt...');
        handleReconnect();
      }, 5000);

      return () => {
        console.log('[ConnectionStatus] Clearing auto-reconnect interval');
        clearInterval(reconnectInterval);
      };
    }
  }, [isConnected, isReconnecting, handleReconnect]);

  return (
    <StatusContainer>
      <StatusDot isConnected={isConnected} />
      {isConnected ? (
        <>
          <Wifi size={14} color="#4CAF50" />
          <StatusText>Connected</StatusText>
          {socketId && <SocketId>({socketId})</SocketId>}
        </>
      ) : (
        <>
          <WifiOff size={14} color="#f44336" />
          <StatusText>Disconnected</StatusText>
          <ReconnectButton
            onClick={handleReconnect}
            isReconnecting={isReconnecting}
            disabled={isReconnecting}
          >
            <RefreshCw size={12} />
            {isReconnecting ? 'Reconnecting...' : 'Reconnect'}
          </ReconnectButton>
        </>
      )}
    </StatusContainer>
  );
}; 