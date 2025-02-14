import React, { useState } from 'react';
import styled, { useTheme } from 'styled-components';
import { Modal, Button } from '../common';
import { StatsCard } from '../common/StatsCard';
import { useMutation, useQuery } from '@apollo/client';
import { ACTIVE_SESSION, END_SESSION, SESSION_WORK_LOGS } from '../../../graphql/queries';
import { ActiveSessionData, Session, SessionWorkLogsData, SessionWorkLogsVariables } from '../../../graphql/types';
import { useApp } from '../../context/AppContext';

interface EndWorkModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ModalContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.lg};
`;

const Title = styled.h2`
  margin: 0;
  color: ${props => props.theme.colors.error};
  font-size: 1.5rem;
  font-weight: 600;
`;

const Message = styled.p`
  color: ${props => props.theme.colors.text};
  margin: 0;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: ${props => props.theme.spacing.md};
  margin: ${props => props.theme.spacing.lg} 0;
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: ${props => props.theme.spacing.sm};
  margin-top: ${props => props.theme.spacing.md};
`;

const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  const parts = [];
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (remainingSeconds > 0 || parts.length === 0) parts.push(`${remainingSeconds}s`);

  return parts.join(' ');
};

const calculateActiveTime = (totalDuration: number, totalBreakTime: number): number => {
  return Math.max(0, totalDuration - totalBreakTime);
};

interface ExtendedSession extends Session {
  totalDuration: number;
  totalBreakTime: number;
}

export const EndWorkModal: React.FC<EndWorkModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { endSession } = useApp();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const { data: sessionData } = useQuery<ActiveSessionData>(ACTIVE_SESSION);
  const { data: workLogsData } = useQuery<SessionWorkLogsData, SessionWorkLogsVariables>(
    SESSION_WORK_LOGS,
    {
      variables: { sessionId: sessionData?.activeSession?.id || '' },
      skip: !sessionData?.activeSession?.id
    }
  );

  const [endSessionMutation] = useMutation(END_SESSION, {
    onCompleted: () => {
      endSession();
      setIsLoading(false);
      onClose();
    },
    onError: (error) => {
      console.error('End session error:', error);
      setError(error.message);
      setIsLoading(false);
    },
    refetchQueries: [{ query: ACTIVE_SESSION }]
  });

  const handleConfirm = async () => {
    try {
      setError('');
      setIsLoading(true);

      if (!sessionData?.activeSession?.id) {
        throw new Error('No active session found');
      }

      await endSessionMutation({
        variables: { id: sessionData.activeSession.id }
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setIsLoading(false);
    }
  };

  const session = sessionData?.activeSession as ExtendedSession | null;
  if (!session) return null;

  // Calculate durations from segments
  const now = Date.now();
  const segments = session.segments || [];
  
  const calculateSegmentDuration = (segment: Session['segments'][0]): number => {
    const startTime = new Date(segment.startTime).getTime();
    const endTime = segment.endTime ? new Date(segment.endTime).getTime() : now;
    return Math.floor((endTime - startTime) / 1000);
  };

  const totalDuration = segments.reduce((acc, segment) => {
    return acc + calculateSegmentDuration(segment);
  }, 0);

  const totalBreakTime = segments
    .filter(segment => segment.type === 'BREAK')
    .reduce((acc, segment) => {
      return acc + calculateSegmentDuration(segment);
    }, 0);

  const activeTime = calculateActiveTime(totalDuration, totalBreakTime);
  const breakCount = segments.filter(segment => segment.type === 'BREAK').length;
  const workLogCount = workLogsData?.sessionWorkLogs?.length || 0;

  const startTime = new Date(session.startTime);
  const sessionDuration = formatDuration(Math.floor((now - startTime.getTime()) / 1000));

  const theme = useTheme();

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalContent>
        <Title>End Work Session</Title>
        <Message>
          Are you sure you want to end your current work session? Here's a summary of your session:
        </Message>

        <StatsGrid>
          <StatsCard
            title="Total Duration"
            value={sessionDuration}
            icon="⏱️"
            color={theme.colors.primary}
          />
          <StatsCard
            title="Active Work Time"
            value={formatDuration(activeTime)}
            icon="💻"
            color={theme.colors.success}
          />
          <StatsCard
            title="Break Time"
            value={formatDuration(totalBreakTime)}
            subtitle={`${breakCount} break${breakCount !== 1 ? 's' : ''} taken`}
            icon="☕️"
            color={theme.colors.warning}
          />
          <StatsCard
            title="Work Logs"
            value={workLogCount}
            subtitle={workLogCount > 0 ? 'Tasks documented' : 'No tasks logged'}
            icon="📝"
            color={theme.colors.info}
          />
        </StatsGrid>

        {error && (
          <div style={{ color: 'red', fontSize: '0.875rem' }}>{error}</div>
        )}

        <ButtonGroup>
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            variant="error"
            onClick={handleConfirm}
            isLoading={isLoading}
          >
            End Session
          </Button>
        </ButtonGroup>
      </ModalContent>
    </Modal>
  );
}; 