import React, { useState } from 'react';
import styled, { ThemeProvider } from 'styled-components';
import { AppProvider } from './context/AppContext';
import { theme } from './styles/theme';
import { GlobalStyles } from './styles/GlobalStyles';
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

const Header = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${props => props.theme.spacing.xl};
`;

const Title = styled.h1`
  margin: 0;
  font-size: 2rem;
  font-weight: 600;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: ${props => props.theme.spacing.md};
`;

const MainContent = styled.main`
  max-width: 800px;
  margin: 0 auto;
`;

const SessionInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.lg};
  align-items: center;
  text-align: center;
  margin-top: ${props => props.theme.spacing.xl};
`;

const ProjectName = styled.h2`
  margin: 0;
  font-size: 1.5rem;
  color: ${props => props.theme.colors.primary};
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

  return (
    <AppContainer>
      <Header>
        <Title>SWOffice</Title>
        <ActionButtons>
          {!state.session.isActive ? (
            <Button onClick={() => setShowStartModal(true)}>
              Start Work
            </Button>
          ) : (
            <>
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
            </>
          )}
        </ActionButtons>
      </Header>

      <MainContent>
        {state.session.isActive && (
          <SessionInfo>
            <ProjectName>{state.session.project}</ProjectName>
            <Timer
              startTime={state.session.startTime}
              isRunning={!state.session.isOnBreak}
              variant={state.session.isOnBreak ? 'break' : 'session'}
            />
          </SessionInfo>
        )}
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
    <ThemeProvider theme={theme}>
      <GlobalStyles />
      <AppProvider>
        <AppContent />
      </AppProvider>
    </ThemeProvider>
  );
};

export default App; 