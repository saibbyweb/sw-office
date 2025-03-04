import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useApolloClient } from '@apollo/client';
import { MdTimer, MdTimerOff, MdWork } from 'react-icons/md';
import { HiLightningBolt, HiPause, HiViewGrid } from 'react-icons/hi';
import { Users } from 'react-feather';
import { ME, ACTIVE_SESSION, START_BREAK, END_BREAK } from '../../graphql/queries';
import { 
  ActiveSessionData, 
  StartBreakData, 
  EndBreakData, 
  StartBreakVariables, 
  EndBreakVariables, 
  BreakType,
  Session 
} from '../../graphql/types';
import { useApp } from '../context/AppContext';
import { Button, Notification, StatsCard } from '../components/common';
import { StartWorkModal, EndWorkModal, BreakModal, SwitchProjectModal, AddWorkLogModal, LogoutModal } from '../components/modals';
import { WorkLogList } from '../components/work-logs/WorkLogList';
import { SegmentsList } from '../components/segments/SegmentsList';
import { UpdateInfo } from '../components/common/UpdateInfo';
import { theme } from '../styles/theme';
import appIcon from '../../assets/icon.png';

const { ipcRenderer } = window.require('electron');

const VersionTag = styled.div`
  position: fixed;
  bottom: 10px;
  right: 10px;
  font-size: 0.75rem;
  color: ${props => props.theme.colors.text}60;
  opacity: 0.7;
  display: flex;
  align-items: center;
  gap: 5px;
  z-index: 1;
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
  position: relative;

  &::before {
    content: '';
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(
      45deg,
      ${props => props.theme.colors.background},
      ${props => `${props.theme.colors.primary}30`},
      ${props => `${props.theme.colors.info}25`},
      ${props => props.theme.colors.background}
    );
    background-size: 400% 400%;
    animation: gradient 15s ease infinite;
    z-index: 0;
  }

  & > * {
    position: relative;
    z-index: 1;
  }

  @keyframes gradient {
    0% {
      background-position: 0% 50%;
    }
    50% {
      background-position: 100% 50%;
    }
    100% {
      background-position: 0% 50%;
    }
  }
`;

const MainContent = styled.main`
  position: relative;
  max-width: 1200px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: ${props => props.theme.spacing.md};
  padding: ${props => props.theme.spacing.md};
  z-index: 1;
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

const Header = styled.header`
  position: relative;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: ${props => props.theme.spacing.md};
  margin-bottom: ${props => props.theme.spacing.lg};
  z-index: 1;
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

const ProjectButton = styled(Button)`
  border: 1px solid ${props => props.theme.colors.text}20;
  box-shadow: 0 2px 4px ${props => props.theme.colors.text}10;
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 8px ${props => props.theme.colors.text}20;
  }

  &:disabled {
    opacity: 0.7;
    transform: none;
    box-shadow: none;
  }
`;

const ActionButtons = styled.div`
  display: flex;
  gap: ${props => props.theme.spacing.md};
  margin-top: ${props => props.theme.spacing.xl};
`;

const IconWrapper = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
`;

const EndBreakButton = styled(Button)`
  margin-top: ${props => props.theme.spacing.sm};
  background: ${props => props.theme.colors.warning}20;
  border: 1px solid ${props => props.theme.colors.warning};
  color: ${props => props.theme.colors.warning};
  
  &:hover {
    background: ${props => props.theme.colors.warning}30;
  }

  svg {
    margin-right: 6px;
  }
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

interface IconProps {
  icon: React.ReactNode;
}

const StatsCardWithIcon = styled(StatsCard)<IconProps>``;

const AppLogo = styled.img`
  width: 48px;
  height: 48px;
  border-radius: 12px;
  margin-right: auto;
  transition: transform 0.2s ease;

  &:hover {
    transform: scale(1.05);
  }
`;

const WelcomeContainer = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: ${props => props.theme.spacing.xl};
  text-align: center;
  max-width: 600px;
  margin: 0 auto;
  padding: ${props => props.theme.spacing.xl} 0;
  z-index: 1;
  
  animation: welcomeAppear 0.6s ease-out;
  
  @keyframes welcomeAppear {
    from {
      opacity: 0;
      transform: scale(0.98);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }
`;

const Greeting = styled.h1`
  font-size: 2.5rem;
  font-weight: 700;
  color: ${props => props.theme.colors.text};
  margin: 0;
  background: linear-gradient(135deg, ${props => props.theme.colors.primary}, ${props => props.theme.colors.info});
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: shimmer 2s infinite;
  background-size: 200% auto;
  
  @keyframes shimmer {
    to {
      background-position: 200% center;
    }
  }
`;

const DateCard = styled.div`
  background: ${props => props.theme.colors.background}40;
  border: 1px solid ${props => props.theme.colors.text}15;
  border-radius: 16px;
  padding: ${props => props.theme.spacing.lg};
  text-align: center;
  box-shadow: 0 4px 12px ${props => props.theme.colors.text}10;
  backdrop-filter: blur(12px);
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px ${props => props.theme.colors.text}15;
  }
`;

const DateText = styled.div`
  font-size: 1.1rem;
  color: ${props => props.theme.colors.text}90;
  margin-bottom: ${props => props.theme.spacing.sm};
`;

const WelcomeMessage = styled.p`
  font-size: 1.1rem;
  color: ${props => props.theme.colors.text}80;
  line-height: 1.6;
  margin: 0;
  max-width: 480px;
`;

const StartButton = styled(Button)`
  font-size: 1.1rem;
  padding: 12px 32px;
  border-radius: 12px;
  background: linear-gradient(135deg, ${props => props.theme.colors.primary}, ${props => props.theme.colors.info});
  border: none;
  box-shadow: 0 4px 12px ${props => props.theme.colors.primary}40;
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px ${props => props.theme.colors.primary}60;
  }
`;

const HeaderActions = styled.div`
  display: flex;
  gap: 1rem;
  align-items: center;
`;

const TeamsButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 8px;
  background-color: ${({ theme }) => theme.colors.primary}20;
  color: ${({ theme }) => theme.colors.primary};
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: ${({ theme }) => theme.colors.primary}30;
  }
`;

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const { state, startSession, switchProject, addWorkLog, startBreak: startBreakAction, endBreak: endBreakAction } = useApp();
  const [showStartModal, setShowStartModal] = useState(false);
  const [showEndModal, setShowEndModal] = useState(false);
  const [showBreakModal, setShowBreakModal] = useState(false);
  const [showSwitchProjectModal, setShowSwitchProjectModal] = useState(false);
  const [showAddWorkLogModal, setShowAddWorkLogModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [appVersion, setAppVersion] = useState<string>('1.0.0');
  const client = useApolloClient();

  const { data: userData, loading: userLoading } = useQuery(ME, {
    onError: (error) => {
      console.error('Error fetching user data:', error);
      if (error.message.includes('Unauthorized')) {
        handleLogout();
      }
    },
  });

  const { data: sessionData, loading: sessionLoading, refetch: refetchSession } = useQuery<ActiveSessionData>(ACTIVE_SESSION, {
    onCompleted: (data) => {
      console.log('Active session data:', data);
      if (data?.activeSession) {
        const session = data.activeSession;
        const startTime = new Date(session.startTime).getTime();
        
        startSession(session.projectId || '', startTime);

        const activeBreak = session.breaks?.find(b => !b.endTime);
        if (activeBreak) {
          console.log('Found active break:', activeBreak);
          startBreakAction(activeBreak.id, activeBreak.type);
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
      startBreakAction(breakData.id, breakData.type.toLowerCase());
      showNotification('success', 'Break started successfully');
    },
    onError: (error) => {
      console.error('Start break error:', error);
      showNotification('error', 'Failed to start break');
    },
  });

  const [endBreakMutation] = useMutation<EndBreakData, EndBreakVariables>(END_BREAK, {
    onCompleted: () => {
      endBreakAction();
      showNotification('success', 'Break ended successfully');
    },
    onError: (error) => {
      console.error('End break error:', error);
      showNotification('error', 'Failed to end break');
    },
  });

  const handleLogout = async () => {
    try {
      // Clear local storage
      localStorage.removeItem('authToken');
      
      // Reset Apollo cache
      await client.clearStore();
      
      // Navigate to login
      navigate('/login');
    } catch (err) {
      console.error('Logout error:', err);
      showNotification('error', 'Failed to logout properly');
    }
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
      endBreakAction();
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
        const startTime = new Date(segment.startTime).getTime();
        return total + Math.floor((now - startTime) / 1000);
      }, 0);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const formatDate = () => {
    return new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

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

  if (userLoading || sessionLoading) {
    return <div>Loading...</div>;
  }

  const hasActiveSession = sessionData?.activeSession || state.session.isActive;
  const activeSession = sessionData?.activeSession;
  const projectName = activeSession?.project?.name || state.session.project;

  if (!hasActiveSession) {
    return (
      <AppContainer>
        <VersionTag>
          v{appVersion}
          {appVersion === '1.0.2' && <NewVersionBadge>NEW</NewVersionBadge>}
        </VersionTag>

        <Header>
          <AppLogo src={appIcon} alt="SW Office" />
          <HeaderActions>
            <TeamsButton onClick={() => navigate('/teams')}>
              <Users size={18} />
              Teams
            </TeamsButton>
            <UserInfo>
              {userData?.me.name} ({userData?.me.email})
            </UserInfo>
            <Button 
              variant="secondary" 
              onClick={() => setShowLogoutModal(true)}
            >
              Logout
            </Button>
          </HeaderActions>
        </Header>
        <MainContent>
          <WelcomeContainer>
            <Greeting>{getGreeting()}, {userData?.me.name?.split(' ')[0]}!</Greeting>
            <DateCard>
              <DateText>{formatDate()}</DateText>
            </DateCard>
            <WelcomeMessage>
              Ready to start your productive day? Track your work sessions, manage breaks, and stay focused with SW Office. Let's make today count!
            </WelcomeMessage>
            <StartButton onClick={() => setShowStartModal(true)}>
              Start Work Session
            </StartButton>
          </WelcomeContainer>
        </MainContent>
        <StartWorkModal
          isOpen={showStartModal}
          onClose={() => setShowStartModal(false)}
        />
        <LogoutModal
          isOpen={showLogoutModal}
          onClose={() => setShowLogoutModal(false)}
          onConfirm={handleLogout}
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
      </VersionTag>
      <Header>
        <AppLogo src={appIcon} alt="SW Office" />
        <HeaderActions>
          <TeamsButton onClick={() => navigate('/teams')}>
            <Users size={18} />
            Teams
          </TeamsButton>
          <UserInfo>
            {userData?.me.name} ({userData?.me.email})
          </UserInfo>
          <Button 
            variant="secondary" 
            onClick={() => setShowLogoutModal(true)}
          >
            Logout
          </Button>
        </HeaderActions>
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
              icon={<IconWrapper><HiLightningBolt /></IconWrapper>}
              subtitle={state.session.isOnBreak ? 'On Break' : 'Currently Working'}
            />
            
            <StatsCard
              title="Break Time"
              value={formatDuration(
                calculateTotalDuration(sessionData?.activeSession?.segments || [], 'BREAK') * 1000
              )}
              color={theme.colors.warning}
              icon={<IconWrapper><HiPause /></IconWrapper>}
            >
              {state.session.isOnBreak && (
                <EndBreakButton
                  size="small"
                  onClick={() => setShowBreakModal(true)}
                >
                  <MdTimerOff /> End Break
                </EndBreakButton>
              )}
            </StatsCard>

            <StatsCard
              title="Current Project"
              value={projectName || 'No Project'}
              color={theme.colors.info}
              icon={<IconWrapper><HiViewGrid /></IconWrapper>}
            >
              <ProjectButton 
                variant="secondary" 
                size="small"
                onClick={() => setShowSwitchProjectModal(true)}
                disabled={state.session.isOnBreak}
                title={state.session.isOnBreak ? "Cannot switch project during a break" : ""}
              >
                Switch Project
              </ProjectButton>
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
              End Work Session For Today
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
      <LogoutModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleLogout}
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