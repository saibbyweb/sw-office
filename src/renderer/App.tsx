import React, { useEffect } from 'react';
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
import { UpdateInfo } from './components/common/UpdateInfo';
import { ConnectionStatus } from '../components/ConnectionStatus';
import { notificationService } from '../services/NotificationService';
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
        </Routes>
      </Router>
      <UpdateInfo />
      <ConnectionStatus />
      <Toaster position="top-right" />
    </>
  );
};

const App: React.FC = () => {
  useEffect(() => {
    notificationService.connect();
    return () => {
      notificationService.disconnect();
    };
  }, []);

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