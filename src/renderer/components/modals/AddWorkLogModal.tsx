import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Modal, Button, Input } from '../common';
import { useMutation, useQuery } from '@apollo/client';
import { ACTIVE_SESSION, ADD_WORK_LOG, UPDATE_WORK_LOG, SESSION_WORK_LOGS } from '../../../graphql/queries';
import { 
  ActiveSessionData, 
  SessionWorkLogsData,
  SessionWorkLogsVariables,
  AddWorkLogInput,
  WorkLog,
  UpdateWorkLogInput 
} from '../../../graphql/types';

interface AddWorkLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  editWorkLog?: WorkLog | null;
}

const ModalContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.lg};
`;

const Title = styled.h2`
  margin: 0;
  color: ${props => props.theme.colors.text};
  font-size: 1.5rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
`;

const Section = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.md};
`;

const TextArea = styled.textarea`
  width: 100%;
  min-height: 150px;
  padding: ${props => props.theme.spacing.md};
  border: 1px solid ${props => props.theme.colors.secondary}40;
  border-radius: 8px;
  background-color: ${props => props.theme.colors.background};
  color: ${props => props.theme.colors.text};
  font-size: 1rem;
  resize: vertical;
  outline: none;

  &:focus {
    border-color: ${props => props.theme.colors.primary};
    box-shadow: 0 0 0 2px ${props => props.theme.colors.primary}20;
  }

  &::placeholder {
    color: ${props => props.theme.colors.text}80;
  }
`;

const LinksArea = styled(TextArea)`
  min-height: 100px;
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: ${props => props.theme.spacing.sm};
  margin-top: ${props => props.theme.spacing.md};
`;

const Optional = styled.span`
  color: ${props => props.theme.colors.text}80;
  font-size: 0.9rem;
  font-weight: normal;
`;

export const AddWorkLogModal: React.FC<AddWorkLogModalProps> = ({
  isOpen,
  onClose,
  editWorkLog
}) => {
  const [content, setContent] = useState('');
  const [linksText, setLinksText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const { data: sessionData } = useQuery<ActiveSessionData>(ACTIVE_SESSION);

  const [addWorkLogMutation] = useMutation<{ addWorkLog: WorkLog }, { input: AddWorkLogInput }>(
    ADD_WORK_LOG,
    {
      onCompleted: () => {
        setIsLoading(false);
        onClose();
      },
      onError: (error) => {
        console.error('Add work log error:', error);
        setError(error.message);
        setIsLoading(false);
      },
      update: (cache, { data }) => {
        if (!data?.addWorkLog || !sessionData?.activeSession?.id) return;

        const existingData = cache.readQuery<SessionWorkLogsData, SessionWorkLogsVariables>({
          query: SESSION_WORK_LOGS,
          variables: { sessionId: sessionData.activeSession.id }
        });

        cache.writeQuery<SessionWorkLogsData, SessionWorkLogsVariables>({
          query: SESSION_WORK_LOGS,
          variables: { sessionId: sessionData.activeSession.id },
          data: {
            sessionWorkLogs: [data.addWorkLog, ...(existingData?.sessionWorkLogs || [])]
          }
        });
      }
    }
  );

  const [updateWorkLogMutation] = useMutation<{ updateWorkLog: WorkLog }, { input: UpdateWorkLogInput }>(
    UPDATE_WORK_LOG,
    {
      onCompleted: () => {
        setIsLoading(false);
        onClose();
      },
      onError: (error) => {
        console.error('Update work log error:', error);
        setError(error.message);
        setIsLoading(false);
      }
    }
  );

  useEffect(() => {
    if (isOpen && editWorkLog) {
      setContent(editWorkLog.content);
      setLinksText(editWorkLog.links.join('\n'));
    } else if (!isOpen) {
      setContent('');
      setLinksText('');
      setError('');
    }
  }, [isOpen, editWorkLog]);

  const handleSubmit = async () => {
    try {
      setError('');
      setIsLoading(true);

      if (!content.trim()) {
        throw new Error('Please describe your work');
      }

      const links = linksText
        .split('\n')
        .map(link => link.trim())
        .filter(Boolean);

      if (editWorkLog) {
        await updateWorkLogMutation({
          variables: {
            input: {
              workLogId: editWorkLog.id,
              content: content.trim(),
              links
            }
          }
        });
      } else {
        if (!sessionData?.activeSession?.id) {
          throw new Error('No active session found');
        }

        await addWorkLogMutation({
          variables: {
            input: {
              sessionId: sessionData.activeSession.id,
              projectId: sessionData.activeSession.projectId || '',
              content: content.trim(),
              links
            }
          }
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalContent>
        <Title>{editWorkLog ? 'Edit Work Log' : 'Add Work Log'}</Title>

        <Section>
          <TextArea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="Describe your work, achievements, or completed tasks..."
          />
        </Section>

        <Section>
          <Title>
            Related Links <Optional>(optional)</Optional>
          </Title>
          <LinksArea
            value={linksText}
            onChange={e => setLinksText(e.target.value)}
            placeholder="Add PR links or other relevant URLs (one per line)"
          />
        </Section>

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
            {editWorkLog ? 'Update' : 'Save'}
          </Button>
        </ButtonGroup>
      </ModalContent>
    </Modal>
  );
}; 