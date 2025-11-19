import React, { useEffect, useState } from 'react';
import { ThemeProvider } from 'styled-components';
import { AppProvider } from './context/AppContext';
import { theme } from './styles/theme';
import { GlobalStyles } from './styles/GlobalStyles';
import { ApolloProvider } from '@apollo/client';
import { client } from '../lib/apollo';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { PrivateRoute } from './components/common/PrivateRoute';
import { Home } from './routes/Home';
import { History } from './routes/History';
import { Login } from './routes/Login';
import { Teams } from './routes/Teams';
import { Tasks } from './routes/Tasks';
import { UpdateInfo } from './components/common/UpdateInfo';
import { ConnectionStatus } from '../components/ConnectionStatus';
import { notificationService } from '../services/NotificationService';
import { localNotificationService } from '../services/LocalNotificationService';
import { CallProvider } from '../components/CallProvider';
import { Toaster } from 'react-hot-toast';
import { ConnectedUsersProvider } from '../contexts/ConnectedUsersContext';

const AppContent: React.FC = () => {
  return (
    <>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={
            <PrivateRoute>
              <Home />
            </PrivateRoute>
          } />
          <Route path="/history" element={
            <PrivateRoute>
              <History />
            </PrivateRoute>
          } />
          <Route path="/teams" element={
            <PrivateRoute>
              <Teams />
            </PrivateRoute>
          } />
          <Route path="/tasks" element={
            <PrivateRoute>
              <Tasks />
            </PrivateRoute>
          } />
        </Routes>
      </Router>
      <UpdateInfo />
      <ConnectionStatus />
      <Toaster position="top-right" />
    </>
  );
};

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  useEffect(() => {
    // Request notification permissions when app starts
    const requestNotificationPermission = async () => {
      try {
        const isGranted = await localNotificationService.requestPermission();
        if (isGranted) {
          console.log('[App] Notification permission granted');
          // Show a welcome notification
          localNotificationService.showInfo({
            message: 'You will now receive notification updates from SW Office',
            title: 'Notifications Enabled',
            silent: true,
            bounceDock: false
          });
        
        } else {
          console.log('[App] Notification permission denied');
        }
      } catch (error) {
        console.error('[App] Error requesting notification permission:', error);
      }
    };

    requestNotificationPermission();
  }, []); // Run once when app starts

  useEffect(() => {
    // Check for authentication token
    const checkAuth = () => {
      const authToken = localStorage.getItem('authToken');
      const authenticated = !!authToken;
      
      console.log('[App] Authentication check:', { 
        authenticated, 
        previousState: isAuthenticated 
      });
      
      setIsAuthenticated(authenticated);
      
      if (authenticated) {
        console.log('[App] User is authenticated, connecting to socket');
        notificationService.connect();
      } else {
        console.log('[App] User is not authenticated, disconnecting socket');
        notificationService.disconnect();
      }
    };
    
    // Initial check
    checkAuth();
    
    // Listen for storage events (for when token is added/removed in another tab)
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'authToken') {
        console.log('[App] Auth token changed in storage, rechecking authentication');
        checkAuth();
      }
    };
    
    // Listen for custom auth events (for when token is added/removed in this tab)
    const handleAuthEvent = () => {
      console.log('[App] Auth event detected, rechecking authentication');
      checkAuth();
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('auth-changed', handleAuthEvent);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('auth-changed', handleAuthEvent);
      notificationService.disconnect();
    };
  }, [isAuthenticated]); // Add isAuthenticated as a dependency

  return (
    <ApolloProvider client={client}>
      <ThemeProvider theme={theme}>
        <GlobalStyles />
        <AppProvider>
          <ConnectedUsersProvider>
            <CallProvider>
              <AppContent />
            </CallProvider>
          </ConnectedUsersProvider>
        </AppProvider>
      </ThemeProvider>
    </ApolloProvider>
  );
};

export default App; 