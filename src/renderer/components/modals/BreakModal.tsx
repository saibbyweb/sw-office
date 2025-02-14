import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Modal, Button } from '../common';
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

const BreakTypeContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: ${props => props.theme.spacing.sm};
`;

const BreakTypeButton = styled(Button)<{ isSelected?: boolean }>`
  opacity: ${props => props.isSelected ? 1 : 0.7};
  transform: scale(${props => props.isSelected ? 1.05 : 1});
  transition: all 0.2s ease;
`;

const BreakTypeSelect = styled.select`
  padding: 0.75rem;
  border: 1px solid ${props => props.theme.colors.secondary}40;
  border-radius: 8px;
  font-size: 1rem;
  outline: none;
  width: 100%;
  background-color: ${props => props.theme.colors.background};
  cursor: pointer;

  &:focus {
    border-color: ${props => props.theme.colors.primary};
    box-shadow: 0 0 0 2px ${props => props.theme.colors.primary}20;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: ${props => props.theme.spacing.sm};
  justify-content: flex-end;
  margin-top: ${props => props.theme.spacing.md};
`;

const breakTypes: { type: BreakType; label: string }[] = [
  { type: BreakType.SHORT, label: 'Short Break' },
  { type: BreakType.LUNCH, label: 'Lunch Break' },
  { type: BreakType.OTHER, label: 'Other Break' }
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
            <BreakTypeContainer>
              {breakTypes.map(({ type, label }) => (
                <BreakTypeButton
                  key={type}
                  variant={type === BreakType.LUNCH ? 'warning' : 'secondary'}
                  onClick={() => setSelectedType(type)}
                  isSelected={selectedType === type}
                >
                  {label}
                </BreakTypeButton>
              ))}
            </BreakTypeContainer>

            <BreakTypeSelect
              value={selectedType}
              onChange={e => setSelectedType(e.target.value as BreakType)}
            >
              <option value={BreakType.SHORT}>Short Break</option>
              <option value={BreakType.LUNCH}>Lunch Break</option>
              <option value={BreakType.OTHER}>Other Break</option>
            </BreakTypeSelect>

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