import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Modal, Button, Select } from '../common';
import { useApp } from '../../context/AppContext';
import { useMutation, useQuery } from '@apollo/client';
import { START_BREAK, ACTIVE_SESSION } from '../../../graphql/queries';
import { StartBreakData, StartBreakVariables, ActiveSessionData, BreakType } from '../../../graphql/types';
import { Timer } from '../timer/Timer';

interface BreakModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartBreak: (type: BreakType) => Promise<void>;
  onEndBreak: () => Promise<void>;
}

const ModalContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.md};
`;

const Title = styled.h2`
  margin: 0;
  color: ${props => props.theme.colors.text};
  font-size: 1.5rem;
  font-weight: 600;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: ${props => props.theme.spacing.sm};
  justify-content: flex-end;
  margin-top: ${props => props.theme.spacing.md};
`;

const breakOptions = [
  { value: BreakType.SHORT, label: 'Short Break' },
  { value: BreakType.LUNCH, label: 'Lunch Break' },
  { value: BreakType.PRAYER, label: 'Prayer Break' },
  { value: BreakType.OTHER, label: 'Other Break' }
];

export const BreakModal: React.FC<BreakModalProps> = ({ 
  isOpen, 
  onClose,
  onStartBreak,
  onEndBreak
}) => {
  const { state } = useApp();
  const [selectedType, setSelectedType] = useState<BreakType>(BreakType.SHORT);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const { data: sessionData } = useQuery<ActiveSessionData>(ACTIVE_SESSION);

  useEffect(() => {
    if (!isOpen) {
      setSelectedType(BreakType.SHORT);
      setError('');
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    try {
      setError('');
      setIsLoading(true);
      await onStartBreak(selectedType);
      onClose();
    } catch (err) {
      console.error('Submit error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEndBreak = async () => {
    try {
      setError('');
      setIsLoading(true);
      await onEndBreak();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  // Find active break segment
  const activeBreakSegment = sessionData?.activeSession?.segments?.find(
    segment => segment.type === 'BREAK' && !segment.endTime
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalContent>
        <Title>
          {state.session.isOnBreak ? 'Current Break' : 'Take a Break'}
        </Title>

        {state.session.isOnBreak ? (
          <>
            <Timer
              startTime={activeBreakSegment ? new Date(activeBreakSegment.startTime).getTime() : undefined}
              isRunning={true}
            />
            <ButtonGroup>
              <Button
                variant="secondary"
                onClick={onClose}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                variant="warning"
                onClick={handleEndBreak}
                isLoading={isLoading}
              >
                End Break
              </Button>
            </ButtonGroup>
          </>
        ) : (
          <>
            <Select
              value={selectedType}
              onChange={(value) => setSelectedType(value as BreakType)}
              options={breakOptions}
              placeholder="Select Break Type"
              required
            />

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
                onClick={handleSubmit}
                isLoading={isLoading}
              >
                Start Break
              </Button>
            </ButtonGroup>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}; 