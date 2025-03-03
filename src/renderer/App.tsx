import React, { useState, useEffect } from 'react';
import styled, { ThemeProvider } from 'styled-components';
import { AppProvider } from './context/AppContext';
import { theme } from './styles/theme';
import { GlobalStyles } from './styles/GlobalStyles';
import { ApolloProvider, useQuery, useMutation } from '@apollo/client';
import { client } from '../lib/apollo';
import { Button, Notification } from './components/common';
import { StartWorkModal, EndWorkModal, BreakModal, SwitchProjectModal, AddWorkLogModal } from './components/modals';
import { Timer } from './components/timer/Timer';
import { useApp } from './context/AppContext';
import { LoginScreen } from './components/screens/LoginScreen';
import { ME, ACTIVE_SESSION, START_BREAK, END_BREAK } from '../graphql/queries';
import { 
  ActiveSessionData, 
  StartBreakData, 
  EndBreakData, 
  StartBreakVariables, 
  EndBreakVariables, 
  BreakType,
  Session 
} from '../graphql/types';
import { BreakTimer } from './components/timer/BreakTimer';
import { WorkLogList } from './components/work-logs/WorkLogList';
import { SegmentsList } from './components/segments/SegmentsList';
import { StatsCard } from './components/common/StatsCard';
import { PastSessionsScreen } from './components/screens/PastSessionsScreen';
const { ipcRenderer } = window.require('electron');

const VersionTag = styled.div`
  position: absolute;
  top: 10px;
  left: 10px;
  font-size: 0.75rem;
  color: ${props => props.theme.colors.text}60;
  opacity: 0.7;
  display: flex;
  align-items: center;
  gap: 5px;
`;

const NewVersionBadge = styled.span`
  background-color: ${props => props.theme.colors.primary};
  color: white;
  padding: 2px 5px;
  border-radius: 4px;
  font-size: 0.65rem;
  font-weight: bold;
`;

const AppContainer = styled.div`
  height: 100%;
  overflow-y: auto;
  background-color: ${props => props.theme.colors.background};
  color: ${props => props.theme.colors.text};
  padding: ${props => props.theme.spacing.xl};
`;

const MainContent = styled.main`
  max-width: 1200px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: ${props => props.theme.spacing.md};
  padding: ${props => props.theme.spacing.md};
`;

const Section = styled.section<{ fullWidth?: boolean }>`
  background: ${props => props.theme.colors.background}10;
  border-radius: 16px;
  padding: ${props => props.theme.spacing.md};
  grid-column: ${props => props.fullWidth ? '1 / -1' : 'auto'};
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
  align-items: center;
  gap: ${props => props.theme.spacing.md};
  margin-bottom: ${props => props.theme.spacing.lg};
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
  color: ${props => props.theme.colors.text}80;
  font-size: 0.875rem;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: ${props => props.theme.spacing.md};
`;

const formatDuration = (ms: number) => {
  const hours = Math.floor(ms / (1000 * 60 * 60));
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((ms % (1000 * 60)) / 1000);

  const parts: string[] = [];
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (seconds > 0) parts.push(`${seconds}s`);

  return parts.join(' ') || '0s';
};

const AppContent: React.FC = () => {
  const { state, startSession, switchProject, addWorkLog, startBreak, endBreak } = useApp();
  const [showStartModal, setShowStartModal] = useState(false);
  const [showEndModal, setShowEndModal] = useState(false);
  const [showBreakModal, setShowBreakModal] = useState(false);
  const [showSwitchProjectModal, setShowSwitchProjectModal] = useState(false);
  const [showAddWorkLogModal, setShowAddWorkLogModal] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(localStorage.getItem('authToken'));
  const [showPastSessions, setShowPastSessions] = useState(false);
  const [appVersion, setAppVersion] = useState<string>('1.0.0');

  const { data: userData, loading: userLoading } = useQuery(ME, {
    skip: !authToken,
    onError: (error) => {
      console.error('Error fetching user data:', error);
      if (error.message.includes('Unauthorized')) {
        handleLogout();
      }
    },
  });

  const { data: sessionData, loading: sessionLoading, refetch: refetchSession } = useQuery<ActiveSessionData>(ACTIVE_SESSION, {
    skip: !authToken,
    onCompleted: (data) => {
      console.log('Active session data:', data);
      if (data?.activeSession) {
        const session = data.activeSession;
        const startTime = new Date(session.startTime).getTime();
        
        // Initialize session
        startSession(session.projectId || '', startTime);

        // Check for active break
        const activeBreak = session.breaks?.find(b => !b.endTime);
        if (activeBreak) {
          console.log('Found active break:', activeBreak);
          startBreak(activeBreak.id, activeBreak.type);
        }
      }
    },
    onError: (error) => {
      console.error('Error fetching active session:', error);
      showNotification('error', 'Failed to fetch active session');
    },
  });

  const [startBreakMutation] = useMutation<StartBreakData, StartBreakVariables>(START_BREAK, {
    onCompleted: (data) => {
      const breakData = data.startBreak;
      startBreak(breakData.id, breakData.type.toLowerCase());
      showNotification('success', 'Break started successfully');
    },
    onError: (error) => {
      console.error('Start break error:', error);
      showNotification('error', 'Failed to start break');
    },
  });

  const [endBreakMutation] = useMutation<EndBreakData, EndBreakVariables>(END_BREAK, {
    onCompleted: () => {
      endBreak();
      showNotification('success', 'Break ended successfully');
    },
    onError: (error) => {
      console.error('End break error:', error);
      showNotification('error', 'Failed to end break');
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

  const handleSwitchProject = async (projectId: string) => {
    try {
      if (!sessionData?.activeSession?.id) {
        throw new Error('No active session found');
      }

      await switchProject(projectId);
      await refetchSession();
    } catch (err) {
      console.error('Handle switch project error:', err);
      showNotification('error', err instanceof Error ? err.message : 'Failed to switch project');
    }
  };

  const handleAddWorkLog = async (content: string, links: string[]) => {
    try {
      if (!sessionData?.activeSession?.id) {
        throw new Error('No active session found');
      }

      await addWorkLog(content, links);
      await refetchSession();
    } catch (err) {
      console.error('Handle add work log error:', err);
      showNotification('error', err instanceof Error ? err.message : 'Failed to add work log');
    }
  };

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleStartBreak = async (type: BreakType) => {
    try {
      if (!sessionData?.activeSession?.id) {
        throw new Error('No active session found');
      }

      await startBreakMutation({
        variables: {
          input: {
            type,
            sessionId: sessionData.activeSession.id,
          },
        },
      });
      await refetchSession();
    } catch (err) {
      console.error('Handle start break error:', err);
      showNotification('error', err instanceof Error ? err.message : 'Failed to start break');
    }
  };

  const handleEndBreak = async () => {
    try {
      if (!state.session.currentBreak?.id) {
        throw new Error('No active break found');
      }

      await endBreakMutation({
        variables: {
          breakId: state.session.currentBreak.id,
        },
      });
      endBreak();
      await refetchSession();
    } catch (err) {
      console.error('Handle end break error:', err);
      showNotification('error', err instanceof Error ? err.message : 'Failed to end break');
    }
  };

  const calculateTotalDuration = (segments: Session['segments'], type: 'WORK' | 'BREAK'): number => {
    if (!segments) return 0;
    const now = Date.now();
    return segments
      .filter(segment => segment.type === type)
      .reduce((total: number, segment: Session['segments'][0]) => {
        if (segment.endTime) {
          return total + segment.duration;
        }
        // For active segment, calculate up to current time
        const startTime = new Date(segment.startTime).getTime();
        return total + Math.floor((now - startTime) / 1000);
      }, 0);
  };

  // Get app version using IPC
  useEffect(() => {
    const getAppVersion = async () => {
      try {
        const version = await ipcRenderer.invoke('get-app-version');
        setAppVersion(version);
      } catch (error) {
        console.error('Failed to get app version:', error);
      }
    };
    
    getAppVersion();
  }, []);

  if (!authToken) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

  if (showPastSessions) {
    return <PastSessionsScreen onBack={() => setShowPastSessions(false)} />;
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
        <VersionTag>
          v{appVersion}
          <NewVersionBadge>NEW - FROM THE OVEN</NewVersionBadge>
        </VersionTag>
        <Header>
          <UserInfo>
            {userData?.me.name} ({userData?.me.email})
          </UserInfo>
          <Button 
            variant="secondary" 
            onClick={() => setShowPastSessions(true)}
          >
            View History
          </Button>
          <Button 
            variant="secondary" 
            onClick={handleLogout}
          >
            Logout
          </Button>
        </Header>
        <MainContent>
          <Section fullWidth>
            <StatsGrid>
              <StatsCard
                title="Active Time"
                value={formatDuration(
                  calculateTotalDuration(sessionData?.activeSession?.segments || [], 'WORK') * 1000
                )}
                color={theme.colors.primary}
                icon="⚡"
                subtitle={state.session.isOnBreak ? 'On Break' : 'Currently Working'}
              />
              
              <StatsCard
                title="Break Time"
                value={formatDuration(
                  calculateTotalDuration(sessionData?.activeSession?.segments || [], 'BREAK') * 1000
                )}
                color={theme.colors.warning}
                icon="⏸️"
              />

              <StatsCard
                title="Current Project"
                value={projectName || 'No Project'}
                color={theme.colors.info}
                icon="🎯"
              >
                <Button 
                  variant="secondary" 
                  size="small"
                  onClick={() => setShowSwitchProjectModal(true)}
                  disabled={state.session.isOnBreak}
                  title={state.session.isOnBreak ? "Cannot switch project during a break" : ""}
                >
                  Switch Project
                </Button>
              </StatsCard>
            </StatsGrid>
          </Section>

          <Section fullWidth>
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
            {sessionData?.activeSession && (
              <WorkLogList sessionId={sessionData.activeSession.id} />
            )}
          </Section>

          <Section fullWidth>
            <SectionHeader>
              <SectionTitle>
                <span role="img" aria-label="segments">📊</span>
                Session Segments
              </SectionTitle>
            </SectionHeader>
            {sessionData?.activeSession?.segments && (
              <SegmentsList segments={sessionData.activeSession.segments} />
            )}
          </Section>

          <Section fullWidth>
            <ActionButtons>
              <Button
                variant="warning"
                onClick={() => setShowBreakModal(true)}
              >
                {state.session.isOnBreak ? 'End Break' : 'Take Break'}
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
          </Section>
        </MainContent>

        <EndWorkModal
          isOpen={showEndModal}
          onClose={() => setShowEndModal(false)}
        />
        <BreakModal
          isOpen={showBreakModal}
          onClose={() => setShowBreakModal(false)}
          onStartBreak={handleStartBreak}
          onEndBreak={handleEndBreak}
        />
        <SwitchProjectModal
          isOpen={showSwitchProjectModal}
          onClose={() => setShowSwitchProjectModal(false)}
          onSwitch={handleSwitchProject}
        />
        <AddWorkLogModal
          isOpen={showAddWorkLogModal}
          onClose={() => setShowAddWorkLogModal(false)}
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
      <VersionTag>
        v{appVersion}
        {appVersion === '1.0.2' && <NewVersionBadge>NEW</NewVersionBadge>}
      </VersionTag>
      <Header>
        <UserInfo>
          {userData?.me.name} ({userData?.me.email})
        </UserInfo>
        <Button 
          variant="secondary" 
          onClick={() => setShowPastSessions(true)}
        >
          View History
        </Button>
        <Button 
          variant="secondary" 
          onClick={handleLogout}
        >
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