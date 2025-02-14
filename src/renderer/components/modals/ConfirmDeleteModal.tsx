import React from 'react';
import styled from 'styled-components';
import { Modal, Button } from '../common';
import { WorkLog } from '../../../graphql/types';

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  workLog: WorkLog | null;
  onConfirm: () => void;
  isLoading: boolean;
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

const Content = styled.div`
  padding: ${props => props.theme.spacing.md};
  background: ${props => props.theme.colors.background}80;
  border-radius: 8px;
  border: 1px solid ${props => props.theme.colors.secondary}20;
  color: ${props => props.theme.colors.text}80;
  font-style: italic;
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: ${props => props.theme.spacing.sm};
  margin-top: ${props => props.theme.spacing.md};
`;

export const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  isOpen,
  onClose,
  workLog,
  onConfirm,
  isLoading
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalContent>
        <Title>Delete Work Log</Title>
        <Message>Are you sure you want to delete this work log?</Message>
        
        {workLog && (
          <Content>
            {workLog.content}
          </Content>
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
            onClick={onConfirm}
            isLoading={isLoading}
          >
            Delete
          </Button>
        </ButtonGroup>
      </ModalContent>
    </Modal>
  );
}; 