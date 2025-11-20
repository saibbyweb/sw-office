import React from 'react';
import styled from 'styled-components';
import { CheckCircle, AlertCircle, X } from 'react-feather';

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: ${props => props.theme.spacing.lg};
`;

const ModalContent = styled.div`
  background: ${props => props.theme.colors.background}F0;
  border: 1px solid ${props => props.theme.colors.text}20;
  border-radius: 16px;
  padding: ${props => props.theme.spacing.xl};
  max-width: 500px;
  width: 100%;
  backdrop-filter: blur(12px);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: ${props => props.theme.spacing.lg};
`;

const HeaderContent = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.md};
  flex: 1;
`;

const IconWrapper = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: ${props => props.theme.colors.primary}20;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${props => props.theme.colors.primary};
`;

const HeaderText = styled.div`
  flex: 1;
`;

const ModalTitle = styled.h2`
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: ${props => props.theme.colors.text};
`;

const ModalSubtitle = styled.p`
  margin: 4px 0 0;
  font-size: 0.875rem;
  color: ${props => props.theme.colors.text}80;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: ${props => props.theme.colors.text}60;
  cursor: pointer;
  padding: ${props => props.theme.spacing.xs};
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  transition: all 0.2s ease;

  &:hover {
    background: ${props => props.theme.colors.text}10;
    color: ${props => props.theme.colors.text};
  }
`;

const TaskInfo = styled.div`
  background: ${props => props.theme.colors.background}40;
  border: 1px solid ${props => props.theme.colors.text}10;
  border-radius: 12px;
  padding: ${props => props.theme.spacing.lg};
  margin-bottom: ${props => props.theme.spacing.lg};
`;

const TaskTitle = styled.h3`
  margin: 0 0 ${props => props.theme.spacing.sm};
  font-size: 1rem;
  font-weight: 600;
  color: ${props => props.theme.colors.text};
`;

const TaskDescription = styled.p`
  margin: 0 0 ${props => props.theme.spacing.md};
  font-size: 0.875rem;
  color: ${props => props.theme.colors.text}80;
  line-height: 1.5;
`;

const TaskMetaRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${props => props.theme.spacing.sm};
`;

const MetaBadge = styled.span<{ variant?: string }>`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 500;
  background: ${props => {
    switch (props.variant) {
      case 'CRITICAL':
        return props.theme.colors.error + '20';
      case 'HIGH':
        return props.theme.colors.warning + '20';
      case 'MEDIUM':
        return props.theme.colors.primary + '20';
      case 'LOW':
        return props.theme.colors.text + '20';
      default:
        return props.theme.colors.text + '15';
    }
  }};
  color: ${props => {
    switch (props.variant) {
      case 'CRITICAL':
        return props.theme.colors.error;
      case 'HIGH':
        return props.theme.colors.warning;
      case 'MEDIUM':
        return props.theme.colors.primary;
      case 'LOW':
        return props.theme.colors.text + 'CC';
      default:
        return props.theme.colors.text + '90';
    }
  }};
`;

const InfoBox = styled.div`
  display: flex;
  gap: ${props => props.theme.spacing.md};
  padding: ${props => props.theme.spacing.md};
  background: ${props => props.theme.colors.primary}10;
  border: 1px solid ${props => props.theme.colors.primary}20;
  border-radius: 8px;
  margin-bottom: ${props => props.theme.spacing.lg};
`;

const InfoIconWrapper = styled.div`
  color: ${props => props.theme.colors.primary};
  flex-shrink: 0;
`;

const InfoText = styled.div`
  font-size: 0.875rem;
  color: ${props => props.theme.colors.text}90;
  line-height: 1.5;
`;

const ModalActions = styled.div`
  display: flex;
  gap: ${props => props.theme.spacing.md};
  justify-content: flex-end;
`;

const Button = styled.button<{ variant?: 'primary' | 'secondary' }>`
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.lg};
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};

  ${props => props.variant === 'primary' ? `
    background: ${props.theme.colors.primary};
    color: white;

    &:hover:not(:disabled) {
      background: ${props.theme.colors.primary}CC;
      transform: translateY(-1px);
      box-shadow: 0 4px 12px ${props.theme.colors.primary}40;
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  ` : `
    background: ${props.theme.colors.background}40;
    border: 1px solid ${props.theme.colors.text}20;
    color: ${props.theme.colors.text}90;

    &:hover {
      background: ${props.theme.colors.background}60;
      border-color: ${props.theme.colors.text}40;
    }
  `}
`;

interface Task {
  id: string;
  title: string;
  description: string;
  priority: string;
  category: string;
  estimatedHours: number;
}

interface SelfAssignConfirmModalProps {
  task: Task;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

const formatCategory = (category: string): string => {
  return category.replace(/_/g, ' ');
};

export const SelfAssignConfirmModal: React.FC<SelfAssignConfirmModalProps> = ({
  task,
  onConfirm,
  onCancel,
  loading = false,
}) => {
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !loading) {
      onCancel();
    }
  };

  return (
    <ModalOverlay onClick={handleOverlayClick}>
      <ModalContent>
        <ModalHeader>
          <HeaderContent>
            <IconWrapper>
              <CheckCircle size={24} />
            </IconWrapper>
            <HeaderText>
              <ModalTitle>Assign Task to Yourself</ModalTitle>
              <ModalSubtitle>Please confirm your assignment</ModalSubtitle>
            </HeaderText>
          </HeaderContent>
          <CloseButton onClick={onCancel} disabled={loading}>
            <X size={20} />
          </CloseButton>
        </ModalHeader>

        <TaskInfo>
          <TaskTitle>{task.title}</TaskTitle>
          <TaskDescription>{task.description}</TaskDescription>
          <TaskMetaRow>
            <MetaBadge variant={task.priority}>{task.priority}</MetaBadge>
            <MetaBadge>{formatCategory(task.category)}</MetaBadge>
            <MetaBadge>{task.estimatedHours}h estimated</MetaBadge>
          </TaskMetaRow>
        </TaskInfo>

        <InfoBox>
          <InfoIconWrapper>
            <AlertCircle size={20} />
          </InfoIconWrapper>
          <InfoText>
            By assigning this task to yourself, you're committing to complete it.
            The task status will remain <strong>Approved</strong> and you'll be marked as the assignee.
          </InfoText>
        </InfoBox>

        <ModalActions>
          <Button variant="secondary" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
          <Button variant="primary" onClick={onConfirm} disabled={loading}>
            <CheckCircle size={16} />
            {loading ? 'Assigning...' : 'Confirm Assignment'}
          </Button>
        </ModalActions>
      </ModalContent>
    </ModalOverlay>
  );
};
