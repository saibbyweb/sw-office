import React, { useState } from 'react';
import styled from 'styled-components';
import { Modal, Button, Input } from '../common';
import { useApp } from '../../context/AppContext';

interface EndWorkModalProps {
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

const Summary = styled.div`
  background-color: ${props => props.theme.colors.background};
  border-radius: 8px;
  padding: ${props => props.theme.spacing.md};
  border: 1px solid ${props => props.theme.colors.secondary}20;
`;

const SummaryItem = styled.div`
  display: flex;
  justify-content: space-between;
  padding: ${props => props.theme.spacing.xs} 0;
  border-bottom: 1px solid ${props => props.theme.colors.secondary}20;

  &:last-child {
    border-bottom: none;
  }
`;

const Label = styled.span`
  color: ${props => props.theme.colors.text}80;
  font-size: 0.875rem;
`;

const Value = styled.span`
  color: ${props => props.theme.colors.text};
  font-weight: 500;
`;

const TextArea = styled.textarea`
  padding: 0.75rem;
  border: 1px solid ${props => props.theme.colors.secondary}40;
  border-radius: 8px;
  font-size: 1rem;
  outline: none;
  width: 100%;
  min-height: 100px;
  resize: vertical;

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

export const EndWorkModal: React.FC<EndWorkModalProps> = ({ isOpen, onClose }) => {
  const { state, endSession, addWorkLog } = useApp();
  const [workLog, setWorkLog] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const formatDuration = (ms: number) => {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  const handleSubmit = async () => {
    try {
      setError('');
      setIsLoading(true);

      if (workLog.trim()) {
        addWorkLog(workLog.trim(), []);
      }

      endSession();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const sessionDuration = Date.now() - state.session.startTime;
  const netDuration = sessionDuration - state.session.breakTime;

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalContent>
        <Title>End Work Session</Title>

        <Summary>
          <SummaryItem>
            <Label>Project</Label>
            <Value>{state.session.project}</Value>
          </SummaryItem>
          <SummaryItem>
            <Label>Total Duration</Label>
            <Value>{formatDuration(sessionDuration)}</Value>
          </SummaryItem>
          <SummaryItem>
            <Label>Break Time</Label>
            <Value>{formatDuration(state.session.breakTime)}</Value>
          </SummaryItem>
          <SummaryItem>
            <Label>Net Work Time</Label>
            <Value>{formatDuration(netDuration)}</Value>
          </SummaryItem>
        </Summary>

        <div>
          <Label>Work Log (Optional)</Label>
          <TextArea
            value={workLog}
            onChange={e => setWorkLog(e.target.value)}
            placeholder="What did you work on? Add any notes or links..."
          />
        </div>

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
            End Work
          </Button>
        </ButtonGroup>
      </ModalContent>
    </Modal>
  );
}; 