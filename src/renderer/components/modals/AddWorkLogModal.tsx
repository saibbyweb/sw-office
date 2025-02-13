import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Modal, Button } from '../common';

interface AddWorkLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (content: string, links: string[]) => void;
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

const TitleIcon = styled.img`
  width: 24px;
  height: 24px;
`;

const Section = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.md};
`;

const SectionTitle = styled.h3`
  margin: 0;
  color: ${props => props.theme.colors.text};
  font-size: 1.2rem;
  font-weight: 500;
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
  onSave,
}) => {
  const [content, setContent] = useState('');
  const [linksText, setLinksText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setContent('');
      setLinksText('');
      setError('');
    }
  }, [isOpen]);

  const handleSave = async () => {
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

      onSave(content, links);
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
          <TitleIcon src="path/to/icon.png" alt="" />
          Add Work Log
        </Title>

        <Section>
          <SectionTitle>What did you work on?</SectionTitle>
          <TextArea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="Describe your work, achievements, or completed tasks..."
          />
        </Section>

        <Section>
          <SectionTitle>
            Related Links <Optional>(optional)</Optional>
          </SectionTitle>
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
            onClick={handleSave}
            isLoading={isLoading}
          >
            Save
          </Button>
        </ButtonGroup>
      </ModalContent>
    </Modal>
  );
}; 