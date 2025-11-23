import React from 'react';
import styled from 'styled-components';
import { CheckCircle, AlertTriangle, AlertCircle, X } from 'react-feather';

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

const IconWrapper = styled.div<{ variant: 'completed' | 'partial' }>`
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: ${props => props.variant === 'completed'
    ? props.theme.colors.success + '20'
    : props.theme.colors.warning + '20'};
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${props => props.variant === 'completed'
    ? props.theme.colors.success
    : props.theme.colors.warning};
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
  margin: 0;
  font-size: 0.875rem;
  color: ${props => props.theme.colors.text}80;
  line-height: 1.5;
`;

const InfoBox = styled.div<{ variant: 'completed' | 'partial' }>`
  display: flex;
  gap: ${props => props.theme.spacing.md};
  padding: ${props => props.theme.spacing.md};
  background: ${props => props.variant === 'completed'
    ? props.theme.colors.success + '10'
    : props.theme.colors.warning + '10'};
  border: 1px solid ${props => props.variant === 'completed'
    ? props.theme.colors.success + '20'
    : props.theme.colors.warning + '20'};
  border-radius: 8px;
  margin-bottom: ${props => props.theme.spacing.lg};
`;

const InfoIconWrapper = styled.div<{ variant: 'completed' | 'partial' }>`
  color: ${props => props.variant === 'completed'
    ? props.theme.colors.success
    : props.theme.colors.warning};
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

const Button = styled.button<{ variant?: 'completed' | 'partial' | 'secondary' }>`
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

  ${props => {
    if (props.variant === 'completed') {
      return `
        background: ${props.theme.colors.success};
        color: white;

        &:hover:not(:disabled) {
          background: ${props.theme.colors.success}CC;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px ${props.theme.colors.success}40;
        }

        &:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `;
    } else if (props.variant === 'partial') {
      return `
        background: ${props.theme.colors.warning};
        color: white;

        &:hover:not(:disabled) {
          background: ${props.theme.colors.warning}CC;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px ${props.theme.colors.warning}40;
        }

        &:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `;
    } else {
      return `
        background: ${props.theme.colors.background}40;
        border: 1px solid ${props.theme.colors.text}20;
        color: ${props.theme.colors.text}90;

        &:hover {
          background: ${props.theme.colors.background}60;
          border-color: ${props.theme.colors.text}40;
        }
      `;
    }
  }}
`;

interface Task {
  id: string;
  title: string;
  description: string;
}

interface TaskCompletionConfirmModalProps {
  task: Task;
  completionType: 'COMPLETED' | 'PARTIALLY_COMPLETED';
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export const TaskCompletionConfirmModal: React.FC<TaskCompletionConfirmModalProps> = ({
  task,
  completionType,
  onConfirm,
  onCancel,
  loading = false,
}) => {
  const isCompleted = completionType === 'COMPLETED';
  const variant = isCompleted ? 'completed' : 'partial';

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
            <IconWrapper variant={variant}>
              {isCompleted ? <CheckCircle size={24} /> : <AlertTriangle size={24} />}
            </IconWrapper>
            <HeaderText>
              <ModalTitle>
                {isCompleted ? 'Mark Task as Completed' : 'Mark Task as Partially Completed'}
              </ModalTitle>
              <ModalSubtitle>Please confirm your submission</ModalSubtitle>
            </HeaderText>
          </HeaderContent>
          <CloseButton onClick={onCancel} disabled={loading}>
            <X size={20} />
          </CloseButton>
        </ModalHeader>

        <TaskInfo>
          <TaskTitle>{task.title}</TaskTitle>
          <TaskDescription>{task.description}</TaskDescription>
        </TaskInfo>

        <InfoBox variant={variant}>
          <InfoIconWrapper variant={variant}>
            <AlertCircle size={20} />
          </InfoIconWrapper>
          <InfoText>
            {isCompleted ? (
              <>
                By marking this task as <strong>Completed</strong>, you're confirming that all
                requirements have been met. This will notify admins for review.
              </>
            ) : (
              <>
                By marking this task as <strong>Partially Completed</strong>, you're indicating
                that some work remains. Please provide additional details to admins about what's
                left to complete.
              </>
            )}
          </InfoText>
        </InfoBox>

        <ModalActions>
          <Button variant="secondary" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
          <Button variant={variant} onClick={onConfirm} disabled={loading}>
            {isCompleted ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
            {loading
              ? 'Submitting...'
              : isCompleted
                ? 'Confirm Completion'
                : 'Confirm Partial Completion'
            }
          </Button>
        </ModalActions>
      </ModalContent>
    </ModalOverlay>
  );
};
