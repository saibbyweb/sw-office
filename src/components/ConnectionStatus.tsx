import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { Wifi, WifiOff } from 'react-feather';
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

export const ConnectionStatus: React.FC = () => {
  const [isConnected, setIsConnected] = useState(false);
  const { socket } = useSocket();
  const [socketId, setSocketId] = useState<string>('');

  useEffect(() => {
    const handleConnect = () => {
      setIsConnected(true);
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
        </>
      )}
    </StatusContainer>
  );
}; 