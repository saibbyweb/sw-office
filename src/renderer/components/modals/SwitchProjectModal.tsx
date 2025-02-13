import React, { useState } from 'react';
import styled from 'styled-components';
import { Modal, Button } from '../common';
import { useApp } from '../../context/AppContext';

interface SwitchProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
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

const CurrentProject = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.sm};
  margin-bottom: ${props => props.theme.spacing.md};

  h3 {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 500;
    color: ${props => props.theme.colors.text};
  }

  span {
    font-size: 1.125rem;
    color: ${props => props.theme.colors.text}80;
  }
`;

const Label = styled.h3`
  margin: 0;
  color: ${props => props.theme.colors.text};
  font-size: 1.25rem;
  font-weight: 500;
`;

const ProjectSelect = styled.select`
  padding: 1rem;
  border: 2px solid ${props => props.theme.colors.primary}40;
  border-radius: 8px;
  font-size: 1rem;
  outline: none;
  width: 100%;
  background-color: ${props => props.theme.colors.background}80;
  color: ${props => props.theme.colors.text};
  cursor: pointer;
  appearance: none;
  -webkit-appearance: none;
  background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
  background-repeat: no-repeat;
  background-position: right 1rem center;
  background-size: 1em;

  &:focus {
    border-color: ${props => props.theme.colors.primary};
  }

  option {
    background-color: ${props => props.theme.colors.background};
    color: ${props => props.theme.colors.text};
  }
`;

const CustomProjectInput = styled.input`
  padding: 1rem;
  border: 2px solid ${props => props.theme.colors.primary}40;
  border-radius: 8px;
  font-size: 1rem;
  outline: none;
  width: 100%;
  background-color: ${props => props.theme.colors.background}80;
  color: ${props => props.theme.colors.text};

  &:focus {
    border-color: ${props => props.theme.colors.primary};
  }

  &::placeholder {
    color: ${props => props.theme.colors.text}60;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: ${props => props.theme.spacing.md};
  justify-content: flex-end;
  margin-top: ${props => props.theme.spacing.md};
`;

export const SwitchProjectModal: React.FC<SwitchProjectModalProps> = ({
  isOpen,
  onClose
}) => {
  const { state, switchProject } = useApp();
  const [selectedProject, setSelectedProject] = useState('');
  const [customProject, setCustomProject] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    try {
      setError('');
      setIsLoading(true);

      if (!selectedProject && !customProject) {
        throw new Error('Please select or enter a project');
      }

      const projectName = selectedProject === 'other' ? customProject : selectedProject;
      switchProject(projectName);
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
          <Icon>📚</Icon>
          <Title>Switch Project</Title>
        </Header>

        <CurrentProject>
          <h3>Current Project:</h3>
          <span>{state.session.project}</span>
        </CurrentProject>

        <div>
          <Label>Select Project</Label>
          <ProjectSelect
            value={selectedProject}
            onChange={e => setSelectedProject(e.target.value)}
          >
            <option value="">Choose a project</option>
            {state.projects.projects.map(project => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
            <option value="other">Other</option>
          </ProjectSelect>
        </div>

        {selectedProject === 'other' && (
          <div>
            <Label>Custom Project Name (optional)</Label>
            <CustomProjectInput
              type="text"
              value={customProject}
              onChange={e => setCustomProject(e.target.value)}
              placeholder="Enter project name if selected Other"
            />
          </div>
        )}

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
            Switch Project
          </Button>
        </ButtonGroup>
      </ModalContent>
    </Modal>
  );
}; 