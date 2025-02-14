import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Modal, Button, Input } from '../common';
import { useMutation, useQuery } from '@apollo/client';
import { ACTIVE_SESSION, ADD_WORK_LOG, SESSION_WORK_LOGS } from '../../../graphql/queries';
import { 
  ActiveSessionData, 
  SessionWorkLogsData,
  SessionWorkLogsVariables,
  AddWorkLogInput,
  WorkLog 
} from '../../../graphql/types';

interface AddWorkLogModalProps {
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

        // Read existing work logs
        const existingData = cache.readQuery<SessionWorkLogsData, SessionWorkLogsVariables>({
          query: SESSION_WORK_LOGS,
          variables: { sessionId: sessionData.activeSession.id }
        });

        // Write back to cache with new work log at the start
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

  useEffect(() => {
    if (!isOpen) {
      setContent('');
      setLinksText('');
      setError('');
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    try {
      setError('');
      setIsLoading(true);

      if (!content.trim()) {
        throw new Error('Please describe your work');
      }

      if (!sessionData?.activeSession?.id) {
        throw new Error('No active session found');
      }

      const links = linksText
        .split('\n')
        .map(link => link.trim())
        .filter(Boolean);

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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalContent>
        <Title>Add Work Log</Title>

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
            Save
          </Button>
        </ButtonGroup>
      </ModalContent>
    </Modal>
  );
}; 