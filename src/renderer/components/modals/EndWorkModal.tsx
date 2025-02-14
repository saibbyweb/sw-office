import React, { useState } from 'react';
import styled from 'styled-components';
import { Modal, Button } from '../common';
import { useMutation, useQuery } from '@apollo/client';
import { ACTIVE_SESSION, END_SESSION } from '../../../graphql/queries';
import { ActiveSessionData } from '../../../graphql/types';
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

const ButtonGroup = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: ${props => props.theme.spacing.sm};
  margin-top: ${props => props.theme.spacing.md};
`;

export const EndWorkModal: React.FC<EndWorkModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { endSession } = useApp();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const { data: sessionData } = useQuery<ActiveSessionData>(ACTIVE_SESSION);

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

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalContent>
        <Title>End Work Session</Title>
        <Message>
          Are you sure you want to end your current work session? This action cannot be undone.
        </Message>

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