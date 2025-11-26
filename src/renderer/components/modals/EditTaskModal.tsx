import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useMutation, useQuery } from '@apollo/client';
import { X } from 'react-feather';
import { EDIT_SUGGESTED_TASK, GET_PROJECTS, AVAILABLE_TASKS } from '../../../graphql/queries';
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
  color: ${props => props.theme.colors.text}CC;
`;

const Input = styled.input`
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.md};
  background: ${props => props.theme.colors.background}80;
  border: 1px solid ${props => props.theme.colors.text}20;
  border-radius: 8px;
  color: ${props => props.theme.colors.text};
  font-size: 0.875rem;
  transition: all 0.2s ease;

  &:focus {
    outline: none;
    border-color: ${props => props.theme.colors.primary}60;
    background: ${props => props.theme.colors.background}A0;
  }
`;

const TextArea = styled.textarea`
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.md};
  background: ${props => props.theme.colors.background}80;
  border: 1px solid ${props => props.theme.colors.text}20;
  border-radius: 8px;
  color: ${props => props.theme.colors.text};
  font-size: 0.875rem;
  min-height: 100px;
  resize: vertical;
  transition: all 0.2s ease;
  font-family: inherit;

  &:focus {
    outline: none;
    border-color: ${props => props.theme.colors.primary}60;
    background: ${props => props.theme.colors.background}A0;
  }
`;

const Select = styled.select`
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.md};
  background: ${props => props.theme.colors.background}80;
  border: 1px solid ${props => props.theme.colors.text}20;
  border-radius: 8px;
  color: ${props => props.theme.colors.text};
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s ease;

  &:focus {
    outline: none;
    border-color: ${props => props.theme.colors.primary}60;
    background: ${props => props.theme.colors.background}A0;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: ${props => props.theme.spacing.sm};
  justify-content: flex-end;
  margin-top: ${props => props.theme.spacing.md};
`;

const Button = styled.button<{ variant?: 'primary' | 'secondary' }>`
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.lg};
  background: ${props => props.variant === 'primary'
    ? props.theme.colors.primary
    : `${props.theme.colors.background}60`};
  color: ${props => props.variant === 'primary'
    ? '#ffffff'
    : props.theme.colors.text};
  border: 1px solid ${props => props.variant === 'primary'
    ? 'transparent'
    : `${props.theme.colors.text}20`};
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: ${props => props.variant === 'primary'
      ? `${props.theme.colors.primary}DD`
      : `${props.theme.colors.background}80`};
    transform: translateY(-1px);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`;

const Row = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${props => props.theme.spacing.md};
`;

interface Task {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  points: number;
  estimatedHours: number;
  projectId?: string;
}

interface EditTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task;
}

export const EditTaskModal: React.FC<EditTaskModalProps> = ({
  isOpen,
  onClose,
  task,
}) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    priority: '',
    points: 0,
    estimatedHours: 0,
    projectId: '',
  });

  const { data: projectsData } = useQuery(GET_PROJECTS);
  const projects = projectsData?.projects || [];

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title,
        description: task.description,
        category: task.category,
        priority: task.priority,
        points: task.points,
        estimatedHours: task.estimatedHours,
        projectId: task.projectId || '',
      });
    }
  }, [task]);

  const [editTask, { loading }] = useMutation(EDIT_SUGGESTED_TASK, {
    refetchQueries: ['AvailableTasks'],
    onCompleted: () => {
      toast.success('Task updated successfully!');
      onClose();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update task');
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.description.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    await editTask({
      variables: {
        taskId: task.id,
        input: {
          title: formData.title,
          description: formData.description,
          category: formData.category,
          priority: formData.priority,
          points: parseInt(formData.points.toString()),
          estimatedHours: parseFloat(formData.estimatedHours.toString()),
          projectId: formData.projectId || null,
        },
      },
    });
  };

  if (!isOpen) return null;

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <ModalTitle>Edit Task</ModalTitle>
          <CloseButton onClick={onClose}>
            <X size={20} />
          </CloseButton>
        </ModalHeader>

        <Form onSubmit={handleSubmit}>
          <FormGroup>
            <Label>Title *</Label>
            <Input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Enter task title"
              required
            />
          </FormGroup>

          <FormGroup>
            <Label>Description *</Label>
            <TextArea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe the task in detail"
              required
            />
          </FormGroup>

          <Row>
            <FormGroup>
              <Label>Category</Label>
              <Select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              >
                <option value="">Select category</option>
                <option value="WEB_FRONTEND">Web Frontend</option>
                <option value="WEB_BACKEND">Web Backend</option>
                <option value="MOBILE_ANDROID">Mobile Android</option>
                <option value="MOBILE_IOS">Mobile iOS</option>
                <option value="DESIGN">Design</option>
                <option value="DEVOPS">DevOps</option>
                <option value="QA_TESTING">QA Testing</option>
                <option value="DOCUMENTATION">Documentation</option>
                <option value="RESEARCH">Research</option>
                <option value="OTHER">Other</option>
              </Select>
            </FormGroup>

            <FormGroup>
              <Label>Priority</Label>
              <Select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              >
                <option value="">Select priority</option>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
              </Select>
            </FormGroup>
          </Row>

          <Row>
            <FormGroup>
              <Label>Points</Label>
              <Input
                type="number"
                min="0"
                value={formData.points}
                onChange={(e) => setFormData({ ...formData, points: parseInt(e.target.value) || 0 })}
                placeholder="Task points"
              />
            </FormGroup>

            <FormGroup>
              <Label>Estimated Hours</Label>
              <Input
                type="number"
                min="0"
                step="0.5"
                value={formData.estimatedHours}
                onChange={(e) => setFormData({ ...formData, estimatedHours: parseFloat(e.target.value) || 0 })}
                placeholder="Estimated hours"
              />
            </FormGroup>
          </Row>

          <FormGroup>
            <Label>Project</Label>
            <Select
              value={formData.projectId}
              onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
            >
              <option value="">Select project (optional)</option>
              {projects.map((project: any) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </Select>
          </FormGroup>

          <ButtonGroup>
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={loading}>
              {loading ? 'Updating...' : 'Update Task'}
            </Button>
          </ButtonGroup>
        </Form>
      </ModalContent>
    </ModalOverlay>
  );
};
