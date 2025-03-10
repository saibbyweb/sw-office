import React, { createContext, useContext, useEffect, useState } from 'react';
import { notificationService } from '../services/NotificationService';

// Define the context type
interface ConnectedUsersContextType {
  connectedUsers: string[];
  isLoading: boolean;
}

// Create the context with default values
const ConnectedUsersContext = createContext<ConnectedUsersContextType>({
  connectedUsers: [],
  isLoading: true,
});

// Custom hook to use the context
export const useConnectedUsers = () => useContext(ConnectedUsersContext);

// Provider component
export const ConnectedUsersProvider: React.FC<{ children: React.ReactNode }> = ({ 
  children 
}) => {
  const [connectedUsers, setConnectedUsers] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // Unique ID for this listener
    const listenerId = 'connected-users-context';

    // Handler for connected users updates
    const handleConnectedUsers = (users: string[]) => {
      console.log('[ConnectedUsersContext] Received updated connected users:', users);
      setConnectedUsers(users);
      setIsLoading(false);
    };

    // Register listener for connected users events
    notificationService.addConnectedUsersListener(listenerId, handleConnectedUsers);

    // Clean up on unmount
    return () => {
      notificationService.removeConnectedUsersListener(listenerId);
    };
  }, []);

  const value = {
    connectedUsers,
    isLoading,
  };

  return (
    <ConnectedUsersContext.Provider value={value}>
      {children}
    </ConnectedUsersContext.Provider>
  );
}; 