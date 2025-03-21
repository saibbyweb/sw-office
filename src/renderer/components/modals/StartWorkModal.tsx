import React, { useState } from 'react';
import styled from 'styled-components';
import { Modal, Button, Select } from '../common';
import { useApp } from '../../context/AppContext';
import { useMutation, useQuery } from '@apollo/client';
import { GET_PROJECTS, START_SESSION } from '../../../graphql/queries';
import { GetProjectsData, Project } from '../../../graphql/types';

interface StartWorkModalProps {
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

const DateDisplay = styled.div`
  color: ${props => props.theme.colors.text}80;
  font-size: 0.875rem;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: ${props => props.theme.spacing.sm};
  justify-content: flex-end;
  margin-top: ${props => props.theme.spacing.md};
`;

export const StartWorkModal: React.FC<StartWorkModalProps> = ({ isOpen, onClose }) => {
  const { startSession } = useApp();
  const [selectedProject, setSelectedProject] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const { loading, error: projectsError, data } = useQuery<GetProjectsData>(GET_PROJECTS);

  const [startSessionMutation] = useMutation(START_SESSION, {
    onCompleted: (data) => {
      const session = data.startSession;
      startSession(session.projectId);
      onClose();
    },
    onError: (error) => {
      console.error('Start session error:', error);
      setError(error.message);
      setIsLoading(false);
    },
  });

  const formatDate = () => {
    return new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleSubmit = async () => {
    try {
      setError('');
      setIsLoading(true);

      if (!selectedProject) {
        throw new Error('Please select a project');
      }

      console.log('Starting session with project:', selectedProject);
      
      await startSessionMutation({
        variables: {
          input: {
            projectId: selectedProject
          }
        }
      });
    } catch (err) {
      console.error('Submit error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
      setIsLoading(false);
    }
  };

  if (loading) return null;
  if (projectsError) {
    console.error('Error loading projects:', projectsError);
    return null;
  }

  const projectOptions = data?.projects.map((project: Project) => ({
    value: project.id,
    label: project.name
  })) || [];

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalContent>
        <Title>Start Work Session</Title>
        <DateDisplay>{formatDate()}</DateDisplay>

        <Select
          value={selectedProject}
          onChange={setSelectedProject}
          options={projectOptions}
          placeholder="Select Project"
          required
        />

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
            Start Work
          </Button>
        </ButtonGroup>
      </ModalContent>
    </Modal>
  );
}; 