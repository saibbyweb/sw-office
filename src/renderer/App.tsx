import React, { useState } from 'react';
import styled, { ThemeProvider } from 'styled-components';
import { AppProvider } from './context/AppContext';
import { theme } from './styles/theme';
import { GlobalStyles } from './styles/GlobalStyles';
import { ApolloProvider } from '@apollo/client';
import { client } from '../lib/apollo';
import { Button, Notification } from './components/common';
import { StartWorkModal, EndWorkModal, BreakModal } from './components/modals';
import { Timer } from './components/timer/Timer';
import { useApp } from './context/AppContext';

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

const AppContent: React.FC = () => {
  const { state } = useApp();
  const [showStartModal, setShowStartModal] = useState(false);
  const [showEndModal, setShowEndModal] = useState(false);
  const [showBreakModal, setShowBreakModal] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  if (!state.session.isActive) {
    return (
      <AppContainer>
        <MainContent>
          <Button onClick={() => setShowStartModal(true)}>
            Start Work
          </Button>
        </MainContent>
        <StartWorkModal
          isOpen={showStartModal}
          onClose={() => setShowStartModal(false)}
        />
      </AppContainer>
    );
  }

  return (
    <AppContainer>
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
            <SectionTitle>Current Project: {state.session.project}</SectionTitle>
            <Button variant="secondary" size="small">
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
            <Button variant="secondary" size="small">
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

      <StartWorkModal
        isOpen={showStartModal}
        onClose={() => setShowStartModal(false)}
      />
      <EndWorkModal
        isOpen={showEndModal}
        onClose={() => setShowEndModal(false)}
      />
      <BreakModal
        isOpen={showBreakModal}
        onClose={() => setShowBreakModal(false)}
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