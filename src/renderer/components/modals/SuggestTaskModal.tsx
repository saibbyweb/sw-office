import React, { useState } from 'react';
import styled from 'styled-components';
import { useMutation, useQuery } from '@apollo/client';
import { X } from 'react-feather';
import { CREATE_TASK, GET_PROJECTS, AVAILABLE_TASKS } from '../../../graphql/queries';
import toast from 'react-hot-toast';

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
  background: ${props => props.theme.colors.background}E6;
  border: 1px solid ${props => props.theme.colors.text}20;
  border-radius: 16px;
  padding: ${props => props.theme.spacing.xl};
  max-width: 600px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  backdrop-filter: blur(12px);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);

  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-track {
    background: ${props => props.theme.colors.background}20;
    border-radius: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: ${props => props.theme.colors.text}20;
    border-radius: 4px;

    &:hover {
      background: ${props => props.theme.colors.text}30;
    }
  }
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${props => props.theme.spacing.lg};
`;

const ModalTitle = styled.h2`
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: ${props => props.theme.colors.text};
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: ${props => props.theme.colors.text}80;
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

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.lg};
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.xs};
`;

const Label = styled.label`
  font-size: 0.875rem;
  font-weight: 500;
  color: ${props => props.theme.colors.text}90;
`;

const Required = styled.span`
  color: ${props => props.theme.colors.error};
  margin-left: 4px;
`;

const Input = styled.input`
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.md};
  background: ${props => props.theme.colors.background}40;
  border: 1px solid ${props => props.theme.colors.text}20;
  border-radius: 8px;
  color: ${props => props.theme.colors.text};
  font-size: 0.875rem;
  transition: all 0.2s ease;

  &:focus {
    outline: none;
    border-color: ${props => props.theme.colors.primary}60;
    background: ${props => props.theme.colors.background}60;
  }

  &::placeholder {
    color: ${props => props.theme.colors.text}50;
  }
`;

const TextArea = styled.textarea`
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.md};
  background: ${props => props.theme.colors.background}40;
  border: 1px solid ${props => props.theme.colors.text}20;
  border-radius: 8px;
  color: ${props => props.theme.colors.text};
  font-size: 0.875rem;
  min-height: 100px;
  resize: vertical;
  font-family: inherit;
  transition: all 0.2s ease;

  &:focus {
    outline: none;
    border-color: ${props => props.theme.colors.primary}60;
    background: ${props => props.theme.colors.background}60;
  }

  &::placeholder {
    color: ${props => props.theme.colors.text}50;
  }
`;

const Select = styled.select`
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.md};
  background: ${props => props.theme.colors.background}40;
  border: 1px solid ${props => props.theme.colors.text}20;
  border-radius: 8px;
  color: ${props => props.theme.colors.text};
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s ease;

  &:focus {
    outline: none;
    border-color: ${props => props.theme.colors.primary}60;
  }

  option {
    background: ${props => props.theme.colors.background};
    color: ${props => props.theme.colors.text};
  }
`;

const FormRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${props => props.theme.spacing.md};

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

const FormActions = styled.div`
  display: flex;
  gap: ${props => props.theme.spacing.md};
  justify-content: flex-end;
  margin-top: ${props => props.theme.spacing.md};
`;

const Button = styled.button<{ variant?: 'primary' | 'secondary' }>`
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.lg};
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;

  ${props => props.variant === 'primary' ? `
    background: ${props.theme.colors.primary};
    color: white;

    &:hover:not(:disabled) {
      background: ${props.theme.colors.primary}CC;
      transform: translateY(-1px);
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

const HelpText = styled.span`
  font-size: 0.75rem;
  color: ${props => props.theme.colors.text}60;
  font-style: italic;
`;

interface SuggestTaskModalProps {
  onClose: () => void;
}

export const SuggestTaskModal: React.FC<SuggestTaskModalProps> = ({ onClose }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    priority: '',
    points: '',
    estimatedHours: '',
    projectId: '',
  });

  const { data: projectsData } = useQuery(GET_PROJECTS);
  const [createTask, { loading }] = useMutation(CREATE_TASK, {
    refetchQueries: [{ query: AVAILABLE_TASKS }],
    onCompleted: () => {
      toast.success('Task suggestion submitted successfully!');
      onClose();
    },
    onError: (error) => {
      toast.error(`Failed to submit task: ${error.message}`);
    },
  });

  const projects = projectsData?.projects || [];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.title.trim()) {
      toast.error('Please enter a task title');
      return;
    }
    if (!formData.description.trim()) {
      toast.error('Please enter a task description');
      return;
    }
    if (!formData.category) {
      toast.error('Please select a category');
      return;
    }
    if (!formData.priority) {
      toast.error('Please select a priority');
      return;
    }
    if (!formData.points || parseInt(formData.points) <= 0) {
      toast.error('Please enter valid points');
      return;
    }
    if (!formData.estimatedHours || parseFloat(formData.estimatedHours) <= 0) {
      toast.error('Please enter valid estimated hours');
      return;
    }

    try {
      await createTask({
        variables: {
          input: {
            title: formData.title.trim(),
            description: formData.description.trim(),
            category: formData.category,
            priority: formData.priority,
            points: parseInt(formData.points),
            estimatedHours: parseFloat(formData.estimatedHours),
            projectId: formData.projectId || null,
          },
        },
      });
    } catch (error) {
      console.error('Error creating task:', error);
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <ModalOverlay onClick={handleOverlayClick}>
      <ModalContent>
        <ModalHeader>
          <ModalTitle>Suggest a Task</ModalTitle>
          <CloseButton onClick={onClose}>
            <X size={24} />
          </CloseButton>
        </ModalHeader>

        <Form onSubmit={handleSubmit}>
          <FormGroup>
            <Label>
              Task Title<Required>*</Required>
            </Label>
            <Input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Enter a clear, descriptive task title"
              required
            />
          </FormGroup>

          <FormGroup>
            <Label>
              Description<Required>*</Required>
            </Label>
            <TextArea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Provide detailed information about the task, requirements, and expected outcome"
              required
            />
          </FormGroup>

          <FormRow>
            <FormGroup>
              <Label>
                Category<Required>*</Required>
              </Label>
              <Select
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
              >
                <option value="">Select category</option>
                <option value="WEB_FRONTEND">Web Frontend</option>
                <option value="BACKEND_API">Backend API</option>
                <option value="MOBILE_APP">Mobile App</option>
                <option value="FULL_STACK">Full Stack</option>
                <option value="BUG_FIX">Bug Fix</option>
                <option value="DEVOPS">DevOps</option>
                <option value="TESTING_QA">Testing/QA</option>
                <option value="CODE_REVIEW">Code Review</option>
                <option value="DOCUMENTATION">Documentation</option>
                <option value="RESEARCH">Research</option>
                <option value="DEBUGGING">Debugging</option>
                <option value="CLIENT_COMMUNICATION">Client Communication</option>
                <option value="MENTORING">Mentoring</option>
                <option value="OFFICE_TASKS">Office Tasks</option>
                <option value="MISCELLANEOUS">Miscellaneous</option>
              </Select>
            </FormGroup>

            <FormGroup>
              <Label>
                Priority<Required>*</Required>
              </Label>
              <Select
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                required
              >
                <option value="">Select priority</option>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
              </Select>
            </FormGroup>
          </FormRow>

          <FormRow>
            <FormGroup>
              <Label>
                Points<Required>*</Required>
              </Label>
              <Input
                type="number"
                name="points"
                value={formData.points}
                onChange={handleChange}
                placeholder="e.g., 5"
                min="1"
                required
              />
              <HelpText>Complexity/effort points (1-10)</HelpText>
            </FormGroup>

            <FormGroup>
              <Label>
                Estimated Hours<Required>*</Required>
              </Label>
              <Input
                type="number"
                name="estimatedHours"
                value={formData.estimatedHours}
                onChange={handleChange}
                placeholder="e.g., 4.5"
                step="0.5"
                min="0.5"
                required
              />
              <HelpText>Time to complete (in hours)</HelpText>
            </FormGroup>
          </FormRow>

          <FormGroup>
            <Label>Project</Label>
            <Select
              name="projectId"
              value={formData.projectId}
              onChange={handleChange}
            >
              <option value="">No specific project</option>
              {projects.map((project: any) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </Select>
            <HelpText>Optional: Associate this task with a project</HelpText>
          </FormGroup>

          <FormActions>
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={loading}>
              {loading ? 'Submitting...' : 'Submit Suggestion'}
            </Button>
          </FormActions>
        </Form>
      </ModalContent>
    </ModalOverlay>
  );
};
