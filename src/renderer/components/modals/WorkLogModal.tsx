import React, { useState } from 'react';
import styled from 'styled-components';
import { Modal, Button } from '../common';
import { useApp } from '../../context/AppContext';

interface WorkLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialWorkLog?: {
    id: string;
    content: string;
    links: string[];
  };
}

const ModalContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.lg};
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.md};
`;

const Icon = styled.div`
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
`;

const Title = styled.h2`
  margin: 0;
  color: ${props => props.theme.colors.text};
  font-size: 1.5rem;
  font-weight: 600;
`;

const Label = styled.h3`
  margin: 0;
  color: ${props => props.theme.colors.text};
  font-size: 1.25rem;
  font-weight: 500;
`;

const TextArea = styled.textarea`
  padding: 1rem;
  border: 2px solid ${props => props.theme.colors.primary}40;
  border-radius: 8px;
  font-size: 1rem;
  outline: none;
  width: 100%;
  min-height: 150px;
  resize: vertical;
  background-color: ${props => props.theme.colors.background}80;
  color: ${props => props.theme.colors.text};

  &:focus {
    border-color: ${props => props.theme.colors.primary};
  }

  &::placeholder {
    color: ${props => props.theme.colors.text}60;
  }
`;

const RelatedLinksSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.md};
`;

const LinksTextArea = styled(TextArea)`
  min-height: 100px;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: ${props => props.theme.spacing.md};
  justify-content: flex-end;
  margin-top: ${props => props.theme.spacing.md};
`;

export const WorkLogModal: React.FC<WorkLogModalProps> = ({
  isOpen,
  onClose,
  initialWorkLog
}) => {
  const { addWorkLog } = useApp();
  const [content, setContent] = useState(initialWorkLog?.content || '');
  const [links, setLinks] = useState(initialWorkLog?.links.join('\n') || '');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    try {
      setError('');
      setIsLoading(true);

      if (!content.trim()) {
        throw new Error('Please describe your work');
      }

      const linksList = links
        .split('\n')
        .map(link => link.trim())
        .filter(Boolean);

      if (initialWorkLog) {
        // TODO: Implement edit work log
      } else {
        addWorkLog(content.trim(), linksList);
      }

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
        <Header>
          <Icon>📝</Icon>
          <Title>Add Work Log</Title>
        </Header>

        <div>
          <Label>What did you work on?</Label>
          <TextArea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="Describe your work, achievements, or completed tasks..."
          />
        </div>

        <RelatedLinksSection>
          <Label>Related Links (optional)</Label>
          <LinksTextArea
            value={links}
            onChange={e => setLinks(e.target.value)}
            placeholder="Add PR links or other relevant URLs (one per line)"
          />
        </RelatedLinksSection>

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