import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Modal, Button, Input } from '../common';
import { useQuery, useMutation } from '@apollo/client';
import { GET_PROJECTS, ACTIVE_SESSION, SWITCH_PROJECT } from '../../../graphql/queries';
import { 
  GetProjectsData, 
  Project, 
  ActiveSessionData,
  SwitchProjectData,
  SwitchProjectVariables 
} from '../../../graphql/types';

interface SwitchProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitch: (projectId: string) => void;
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

const ProjectSelect = styled.select`
  padding: 0.75rem;
  border: 1px solid ${props => props.theme.colors.secondary}40;
  border-radius: 8px;
  font-size: 1rem;
  outline: none;
  width: 100%;
  background-color: ${props => props.theme.colors.background};
  cursor: pointer;

  &:focus {
    border-color: ${props => props.theme.colors.primary};
    box-shadow: 0 0 0 2px ${props => props.theme.colors.primary}20;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: ${props => props.theme.spacing.sm};
  justify-content: flex-end;
  margin-top: ${props => props.theme.spacing.md};
`;

export const SwitchProjectModal: React.FC<SwitchProjectModalProps> = ({ 
  isOpen, 
  onClose,
  onSwitch 
}) => {
  const [selectedProject, setSelectedProject] = useState('');
  const [customProject, setCustomProject] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const { loading, error: projectsError, data } = useQuery<GetProjectsData>(GET_PROJECTS);
  const { data: sessionData } = useQuery<ActiveSessionData>(ACTIVE_SESSION);

  const [switchProjectMutation] = useMutation<SwitchProjectData, SwitchProjectVariables>(
    SWITCH_PROJECT,
    {
      onCompleted: (data) => {
        const project = data.switchProject.project;
        if (project) {
          onSwitch(project.id);
        }
        setIsLoading(false);
        onClose();
      },
      onError: (error) => {
        console.error('Switch project error:', error);
        setError(error.message);
        setIsLoading(false);
      },
      refetchQueries: [{ query: ACTIVE_SESSION }],
    }
  );

  useEffect(() => {
    if (!isOpen) {
      setSelectedProject('');
      setCustomProject('');
      setError('');
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    try {
      setError('');
      setIsLoading(true);

      if (!selectedProject && !customProject) {
        throw new Error('Please select or enter a project');
      }

      if (!sessionData?.activeSession?.id) {
        throw new Error('No active session found');
      }

      const projectId = selectedProject === 'other' ? customProject : selectedProject;

      await switchProjectMutation({
        variables: {
          input: {
            projectId,
            sessionId: sessionData.activeSession.id
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
        <Title>Switch Project</Title>

        <ProjectSelect
          value={selectedProject}
          onChange={e => setSelectedProject(e.target.value)}
        >
          <option value="">Select Project</option>
          {data?.projects?.map((project: Project) => (
            <option 
              key={project.id} 
              value={project.id}
              disabled={project.id === sessionData?.activeSession?.projectId}
            >
              {project.name} {project.id === sessionData?.activeSession?.projectId ? '(Current)' : ''}
            </option>
          ))}
          <option value="other">Other</option>
        </ProjectSelect>

        {selectedProject === 'other' && (
          <Input
            label="Custom Project Name"
            value={customProject}
            onChange={e => setCustomProject(e)}
            placeholder="Enter project name"
            required
          />
        )}

        {error && (
          <div style={{ color: 'red', fontSize: '0.875rem' }}>{error}</div>
        )}

        {projectsError && (
          <div style={{ color: 'red', fontSize: '0.875rem' }}>
            Error loading projects. Please try again.
          </div>
        )}

        <ButtonGroup>
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={isLoading || loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            isLoading={isLoading || loading}
            disabled={selectedProject === sessionData?.activeSession?.projectId}
          >
            Switch Project
          </Button>
        </ButtonGroup>
      </ModalContent>
    </Modal>
  );
}; 