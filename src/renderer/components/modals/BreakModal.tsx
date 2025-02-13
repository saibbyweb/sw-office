import React, { useState } from 'react';
import styled from 'styled-components';
import { Modal, Button } from '../common';
import { useApp } from '../../context/AppContext';
import { BreakType } from '../../types';
import { Timer } from '../timer/Timer';

interface BreakModalProps {
  isOpen: boolean;
  onClose: () => void;
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

const ButtonGroup = styled.div`
  display: flex;
  gap: ${props => props.theme.spacing.sm};
  justify-content: flex-end;
  margin-top: ${props => props.theme.spacing.md};
`;

const breakTypes: { type: BreakType; label: string }[] = [
  { type: 'short', label: 'Short Break' },
  { type: 'lunch', label: 'Lunch Break' },
  { type: 'other', label: 'Other Break' }
];

export const BreakModal: React.FC<BreakModalProps> = ({ isOpen, onClose }) => {
  const { state, startBreak, endBreak } = useApp();
  const [selectedType, setSelectedType] = useState<BreakType | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleStartBreak = async () => {
    try {
      setError('');
      setIsLoading(true);

      if (!selectedType) {
        throw new Error('Please select a break type');
      }

      startBreak(selectedType);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEndBreak = async () => {
    try {
      setError('');
      setIsLoading(true);
      endBreak();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalContent>
        <Title>
          {state.session.isOnBreak ? 'Current Break' : 'Take a Break'}
        </Title>

        {state.session.isOnBreak ? (
          <>
            <Timer
              startTime={state.session.currentBreak?.startTime}
              isRunning={true}
              variant="break"
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
                  variant={type === 'lunch' ? 'warning' : 'secondary'}
                  onClick={() => setSelectedType(type)}
                  isSelected={selectedType === type}
                >
                  {label}
                </BreakTypeButton>
              ))}
            </BreakTypeContainer>

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
                variant="warning"
                onClick={handleStartBreak}
                isLoading={isLoading}
                disabled={!selectedType}
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