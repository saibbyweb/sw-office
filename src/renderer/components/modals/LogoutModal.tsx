import React from 'react';
import styled from 'styled-components';
import { Modal, Button } from '../common';

interface LogoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
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

const Message = styled.p`
  margin: 0;
  color: ${props => props.theme.colors.text}80;
  font-size: 0.875rem;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: ${props => props.theme.spacing.sm};
  justify-content: flex-end;
  margin-top: ${props => props.theme.spacing.md};
`;

export const LogoutModal: React.FC<LogoutModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalContent>
        <Title>Confirm Logout</Title>
        <Message>
          Are you sure you want to log out? This will only end your login session - your work session and progress will be saved.
        </Message>
        <ButtonGroup>
          <Button
            variant="secondary"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            variant="error"
            onClick={onConfirm}
          >
            Logout
          </Button>
        </ButtonGroup>
      </ModalContent>
    </Modal>
  );
}; 