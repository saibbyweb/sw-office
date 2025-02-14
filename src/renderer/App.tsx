import React, { useState } from 'react';
import styled, { ThemeProvider } from 'styled-components';
import { AppProvider } from './context/AppContext';
import { theme } from './styles/theme';
import { GlobalStyles } from './styles/GlobalStyles';
import { ApolloProvider, useQuery } from '@apollo/client';
import { client } from '../lib/apollo';
import { Button, Notification } from './components/common';
import { StartWorkModal, EndWorkModal, BreakModal, SwitchProjectModal, AddWorkLogModal } from './components/modals';
import { Timer } from './components/timer/Timer';
import { useApp } from './context/AppContext';
import { LoginScreen } from './components/screens/LoginScreen';
import { ME, ACTIVE_SESSION } from '../graphql/queries';
import { ActiveSessionData } from '../graphql/types';

const AppContainer = styled.div`
  min-height: 100vh;
  background-color: ${props => props.theme.colors.background};
  color: ${props => props.theme.colors.text};
  padding: ${props => props.theme.spacing.xl};
`;

const MainContent = styled.main`
  max-width: 800px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.xl};
`;

const Section = styled.section`
  background: ${props => props.theme.colors.background}80;
  border-radius: 12px;
  padding: ${props => props.theme.spacing.lg};
`;

const SectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${props => props.theme.spacing.md};
`;

const SectionTitle = styled.h2`
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: ${props => props.theme.colors.text};
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
`;

const ProgressBar = styled.div`
  width: 100%;
  height: 8px;
  background: ${props => props.theme.colors.background};
  border-radius: 4px;
  overflow: hidden;
  margin-top: ${props => props.theme.spacing.sm};
`;

const ProgressFill = styled.div<{ progress: number }>`
  width: ${props => props.progress}%;
  height: 100%;
  background: ${props => props.theme.colors.primary};
  transition: width 0.3s ease;
`;

const WorkLogList = styled.div`
  color: ${props => props.theme.colors.text}80;
  font-style: italic;
`;

const TimerSection = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${props => props.theme.spacing.lg};
  margin-top: ${props => props.theme.spacing.lg};
`;

const ActionButtons = styled.div`
  display: flex;
  gap: ${props => props.theme.spacing.md};
  margin-top: ${props => props.theme.spacing.xl};
`;

const Header = styled.header`
  display: flex;
  justify-content: flex-end;
  margin-bottom: ${props => props.theme.spacing.lg};
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
  color: ${props => props.theme.colors.text}80;
  font-size: 0.875rem;
`;

const AppContent: React.FC = () => {
  const { state, startSession, switchProject, addWorkLog } = useApp();
  const [showStartModal, setShowStartModal] = useState(false);
  const [showEndModal, setShowEndModal] = useState(false);
  const [showBreakModal, setShowBreakModal] = useState(false);
  const [showSwitchProjectModal, setShowSwitchProjectModal] = useState(false);
  const [showAddWorkLogModal, setShowAddWorkLogModal] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(localStorage.getItem('authToken'));

  const { data: userData, loading: userLoading } = useQuery(ME, {
    skip: !authToken,
    onError: (error) => {
      console.error('Error fetching user data:', error);
      if (error.message.includes('Unauthorized')) {
        handleLogout();
      }
    },
  });

  const { data: sessionData, loading: sessionLoading } = useQuery<ActiveSessionData>(ACTIVE_SESSION, {
    skip: !authToken,
    onCompleted: (data) => {
      console.log('Active session data:', data);
      if (data?.activeSession) {
        const session = data.activeSession;
        const startTime = new Date(session.startTime).getTime();
        console.log('Starting session with:', {
          projectId: session.projectId,
          startTime,
          session
        });
        startSession(session.projectId || '', startTime);
      }
    },
    onError: (error) => {
      console.error('Error fetching active session:', error);
      showNotification('error', 'Failed to fetch active session');
    },
  });

  const handleLoginSuccess = (token: string) => {
    setAuthToken(token);
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    setAuthToken(null);
    client.resetStore();
    showNotification('success', 'Logged out successfully');
  };

  const handleSwitchProject = (projectId: string) => {
    try {
      switchProject(projectId);
      showNotification('success', 'Project switched successfully');
    } catch (error) {
      showNotification('error', error instanceof Error ? error.message : 'Failed to switch project');
    }
  };

  const handleAddWorkLog = (content: string, links: string[]) => {
    try {
      addWorkLog(content, links);
      showNotification('success', 'Work log added successfully');
    } catch (error) {
      showNotification('error', error instanceof Error ? error.message : 'Failed to add work log');
    }
  };

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  if (!authToken) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

  if (userLoading || sessionLoading) {
    return <div>Loading...</div>;
  }

  const hasActiveSession = sessionData?.activeSession || state.session.isActive;
  console.log('Session state:', {
    sessionData,
    stateSession: state.session,
    hasActiveSession
  });

  if (hasActiveSession) {
    const activeSession = sessionData?.activeSession;
    const projectName = activeSession?.project?.name || state.session.project;

    return (
      <AppContainer>
        <Header>
          <UserInfo>
            {userData?.me.name} ({userData?.me.email})
          </UserInfo>
          <Button variant="secondary" onClick={handleLogout}>
            Logout
          </Button>
        </Header>
        <MainContent>
          <Section>
            <SectionTitle>
              <span role="img" aria-label="active">⚡</span>
              Active Session
            </SectionTitle>
            <Timer
              startTime={state.session.startTime}
              isRunning={!state.session.isOnBreak}
              variant={state.session.isOnBreak ? 'break' : 'session'}
            />
          </Section>

          <Section>
            <SectionTitle>Today's Progress (0.0%)</SectionTitle>
            <ProgressBar>
              <ProgressFill progress={0} />
            </ProgressBar>
          </Section>

          <Section>
            <SectionHeader>
              <SectionTitle>Current Project: {projectName}</SectionTitle>
              <Button 
                variant="secondary" 
                size="small"
                onClick={() => setShowSwitchProjectModal(true)}
              >
                Switch Project
              </Button>
            </SectionHeader>
          </Section>

          <Section>
            <SectionHeader>
              <SectionTitle>
                <span role="img" aria-label="logs">📝</span>
                Work Logs
              </SectionTitle>
              <Button 
                variant="secondary" 
                size="small"
                onClick={() => setShowAddWorkLogModal(true)}
              >
                Add Work Log
              </Button>
            </SectionHeader>
            <WorkLogList>
              No work logs added yet
            </WorkLogList>
          </Section>

          <TimerSection>
            <Section>
              <SectionTitle>
                <span role="img" aria-label="break">⏸️</span>
                Break Time
              </SectionTitle>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', marginTop: '0.5rem' }}>
                {Math.floor(state.session.breakTime / (1000 * 60 * 60))}h {Math.floor((state.session.breakTime % (1000 * 60 * 60)) / (1000 * 60))}m {Math.floor((state.session.breakTime % (1000 * 60)) / 1000)}s
              </div>
            </Section>

            <Section>
              <SectionTitle>
                <span role="img" aria-label="remaining">⏰</span>
                Time Remaining
              </SectionTitle>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', marginTop: '0.5rem' }}>
                7h 59m 55s
              </div>
            </Section>
          </TimerSection>

          <ActionButtons>
            <Button
              variant="warning"
              onClick={() => setShowBreakModal(true)}
              disabled={state.session.isOnBreak}
            >
              {state.session.isOnBreak ? 'On Break' : 'Take Break'}
            </Button>
            <Button
              variant="error"
              onClick={() => setShowEndModal(true)}
            >
              End Work
            </Button>
            <Button variant="secondary">
              View Stats
            </Button>
          </ActionButtons>
        </MainContent>

        <EndWorkModal
          isOpen={showEndModal}
          onClose={() => setShowEndModal(false)}
        />
        <BreakModal
          isOpen={showBreakModal}
          onClose={() => setShowBreakModal(false)}
        />
        <SwitchProjectModal
          isOpen={showSwitchProjectModal}
          onClose={() => setShowSwitchProjectModal(false)}
          onSwitch={handleSwitchProject}
        />
        <AddWorkLogModal
          isOpen={showAddWorkLogModal}
          onClose={() => setShowAddWorkLogModal(false)}
          onSave={handleAddWorkLog}
        />

        {notification && (
          <Notification
            type={notification.type}
            message={notification.message}
          />
        )}
      </AppContainer>
    );
  }

  return (
    <AppContainer>
      <Header>
        <UserInfo>
          {userData?.me.name} ({userData?.me.email})
        </UserInfo>
        <Button variant="secondary" onClick={handleLogout}>
          Logout
        </Button>
      </Header>
      <MainContent>
        <Button onClick={() => setShowStartModal(true)}>
          Start Work
        </Button>
      </MainContent>
      <StartWorkModal
        isOpen={showStartModal}
        onClose={() => setShowStartModal(false)}
      />
      {notification && (
        <Notification
          type={notification.type}
          message={notification.message}
        />
      )}
    </AppContainer>
  );
};

const App: React.FC = () => {
  return (
    <ApolloProvider client={client}>
      <ThemeProvider theme={theme}>
        <GlobalStyles />
        <AppProvider>
          <AppContent />
        </AppProvider>
      </ThemeProvider>
    </ApolloProvider>
  );
};

export default App; 