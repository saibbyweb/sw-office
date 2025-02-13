import React, { useState } from 'react';
import styled from 'styled-components';
import { Modal, Button, Input } from '../common';
import { useApp } from '../../context/AppContext';

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

export const StartWorkModal: React.FC<StartWorkModalProps> = ({ isOpen, onClose }) => {
  const { startSession, state } = useApp();
  const [selectedProject, setSelectedProject] = useState('');
  const [customProject, setCustomProject] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

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

      if (!selectedProject && !customProject) {
        throw new Error('Please select or enter a project');
      }

      if (!password) {
        throw new Error('Password is required');
      }

      // Simulate a brief delay for login
      await new Promise(resolve => setTimeout(resolve, 500));

      // For now, accept any password
      const projectName = selectedProject === 'other' ? customProject : selectedProject;
      startSession(projectName);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCustomProjectChange = (value: string) => {
    setCustomProject(value);
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalContent>
        <Title>Start Work Session</Title>
        <DateDisplay>{formatDate()}</DateDisplay>

        <ProjectSelect
          value={selectedProject}
          onChange={e => setSelectedProject(e.target.value)}
        >
          <option value="">Select Project</option>
          {state.projects.projects.map(project => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
          <option value="other">Other</option>
        </ProjectSelect>

        {selectedProject === 'other' && (
          <Input
            label="Custom Project Name"
            value={customProject}
            onChange={handleCustomProjectChange}
            placeholder="Enter project name"
            required
          />
        )}

        <Input
          label="Password"
          type="password"
          value={password}
          onChange={handlePasswordChange}
          placeholder="Enter your password"
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