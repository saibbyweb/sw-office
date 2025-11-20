import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@apollo/client';
import styled from 'styled-components';
import { Header } from '../components/common/Header';
import { Loader } from '../components/common/Loader';
import { SuggestTaskModal } from '../components/modals/SuggestTaskModal';
import { SelfAssignConfirmModal } from '../components/modals/SelfAssignConfirmModal';
import { ME, AVAILABLE_TASKS, GET_PROJECTS, ASSIGN_TASK } from '../../graphql/queries';
import { CheckSquare, Clock, User, Calendar, AlertCircle, Briefcase, Search, Filter, X, Plus, UserPlus } from 'react-feather';
import toast from 'react-hot-toast';

const Container = styled.div`
  min-height: 100vh;
  background-color: ${props => props.theme.colors.background};
  color: ${props => props.theme.colors.text};
  display: flex;
  flex-direction: column;
`;

const MainContent = styled.div`
  flex: 1;
  padding: ${props => props.theme.spacing.lg} ${props => props.theme.spacing.xl};
  padding-bottom: 150px;
  overflow-y: auto;
  max-height: calc(100vh - 60px);
`;

const FiltersBar = styled.div`
  display: flex;
  gap: ${props => props.theme.spacing.md};
  margin-bottom: ${props => props.theme.spacing.lg};
  flex-wrap: wrap;
  align-items: center;
`;

const SearchContainer = styled.div`
  position: relative;
  flex: 1;
  min-width: 300px;
`;

const SearchInput = styled.input`
  width: 100%;
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.md};
  padding-left: 40px;
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
    color: ${props => props.theme.colors.text}60;
  }
`;

const SearchIcon = styled(Search)`
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: ${props => props.theme.colors.text}60;
  pointer-events: none;
`;

const FilterGroup = styled.div`
  display: flex;
  gap: ${props => props.theme.spacing.sm};
  align-items: center;
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

const ClearFiltersButton = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.md};
  background: ${props => props.theme.colors.background}40;
  border: 1px solid ${props => props.theme.colors.text}20;
  border-radius: 8px;
  color: ${props => props.theme.colors.text}90;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: ${props => props.theme.colors.background}60;
    border-color: ${props => props.theme.colors.primary}40;
  }
`;

const ToggleContainer = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.md};
  background: ${props => props.theme.colors.background}40;
  border: 1px solid ${props => props.theme.colors.text}20;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  user-select: none;

  &:hover {
    background: ${props => props.theme.colors.background}60;
    border-color: ${props => props.theme.colors.primary}40;
  }
`;

const ToggleSwitch = styled.div<{ isActive: boolean }>`
  position: relative;
  width: 40px;
  height: 20px;
  background: ${props => props.isActive ? props.theme.colors.primary : props.theme.colors.text}30;
  border-radius: 10px;
  transition: background 0.2s ease;

  &::after {
    content: '';
    position: absolute;
    top: 2px;
    left: ${props => props.isActive ? '22px' : '2px'};
    width: 16px;
    height: 16px;
    background: white;
    border-radius: 50%;
    transition: left 0.2s ease;
  }
`;

const ToggleLabel = styled.span`
  font-size: 0.875rem;
  color: ${props => props.theme.colors.text}90;
`;

const TopBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${props => props.theme.spacing.lg};
`;

const ResultsCount = styled.div`
  font-size: 0.875rem;
  color: ${props => props.theme.colors.text}80;
`;

const SummaryCards = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: ${props => props.theme.spacing.md};
  margin-bottom: ${props => props.theme.spacing.lg};
`;

const SummaryCard = styled.div<{ variant?: 'primary' | 'success' | 'info'; isActive?: boolean }>`
  background: ${props => {
    if (props.isActive) {
      switch (props.variant) {
        case 'primary':
          return props.theme.colors.primary + '30';
        case 'success':
          return props.theme.colors.success + '30';
        case 'info':
          return props.theme.colors.text + '20';
        default:
          return props.theme.colors.background + '60';
      }
    }
    switch (props.variant) {
      case 'primary':
        return props.theme.colors.primary + '15';
      case 'success':
        return props.theme.colors.success + '15';
      case 'info':
        return props.theme.colors.text + '10';
      default:
        return props.theme.colors.background + '40';
    }
  }};
  border: 2px solid ${props => {
    if (props.isActive) {
      switch (props.variant) {
        case 'primary':
          return props.theme.colors.primary;
        case 'success':
          return props.theme.colors.success;
        case 'info':
          return props.theme.colors.text + '60';
        default:
          return props.theme.colors.text + '40';
      }
    }
    switch (props.variant) {
      case 'primary':
        return props.theme.colors.primary + '30';
      case 'success':
        return props.theme.colors.success + '30';
      case 'info':
        return props.theme.colors.text + '20';
      default:
        return props.theme.colors.text + '10';
    }
  }};
  border-radius: 12px;
  padding: ${props => props.theme.spacing.md};
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.md};
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: ${props => props.isActive ? `0 4px 12px ${props.theme.colors.text}15` : 'none'};

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px ${props => props.theme.colors.text}10;
  }
`;

const SummaryIconWrapper = styled.div<{ variant?: 'primary' | 'success' | 'info' }>`
  width: 48px;
  height: 48px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${props => {
    switch (props.variant) {
      case 'primary':
        return props.theme.colors.primary + '20';
      case 'success':
        return props.theme.colors.success + '20';
      case 'info':
        return props.theme.colors.text + '15';
      default:
        return props.theme.colors.background;
    }
  }};
  color: ${props => {
    switch (props.variant) {
      case 'primary':
        return props.theme.colors.primary;
      case 'success':
        return props.theme.colors.success;
      case 'info':
        return props.theme.colors.text;
      default:
        return props.theme.colors.text;
    }
  }};
`;

const SummaryContent = styled.div`
  flex: 1;
`;

const SummaryLabel = styled.div`
  font-size: 0.75rem;
  color: ${props => props.theme.colors.text}70;
  margin-bottom: 4px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const SummaryValue = styled.div`
  font-size: 1.5rem;
  font-weight: 700;
  color: ${props => props.theme.colors.text};
`;

const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.md};
  margin: ${props => props.theme.spacing.xl} 0 ${props => props.theme.spacing.md};
  padding-bottom: ${props => props.theme.spacing.sm};
  border-bottom: 2px solid ${props => props.theme.colors.text}20;
`;

const SectionTitle = styled.h2`
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: ${props => props.theme.colors.text};
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
`;

const SectionCount = styled.span`
  font-size: 0.875rem;
  color: ${props => props.theme.colors.text}70;
  font-weight: 400;
`;

const SuggestTaskButton = styled.button`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.lg};
  background: ${props => props.theme.colors.primary};
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: ${props => props.theme.colors.primary}CC;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px ${props => props.theme.colors.primary}40;
  }

  &:active {
    transform: translateY(0);
  }
`;

const TasksGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: ${props => props.theme.spacing.lg};
`;

const TaskCard = styled.div<{ priority?: string }>`
  position: relative;
  background: linear-gradient(135deg, ${props => props.theme.colors.background}60 0%, ${props => props.theme.colors.background}40 100%);
  border: 1px solid ${props => props.theme.colors.text}15;
  border-top: 2px solid ${props => {
    switch (props.priority) {
      case 'CRITICAL':
        return props.theme.colors.error + '80';
      case 'HIGH':
        return props.theme.colors.warning + '80';
      case 'MEDIUM':
        return props.theme.colors.primary + '80';
      case 'LOW':
        return props.theme.colors.text + '50';
      default:
        return props.theme.colors.text + '30';
    }
  }};
  border-radius: 12px;
  padding: ${props => props.theme.spacing.lg};
  backdrop-filter: blur(20px);
  box-shadow: 0 8px 32px ${props => props.theme.colors.text}08,
              0 2px 8px ${props => props.theme.colors.text}05;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(90deg,
      ${props => {
        switch (props.priority) {
          case 'CRITICAL':
            return props.theme.colors.error;
          case 'HIGH':
            return props.theme.colors.warning;
          case 'MEDIUM':
            return props.theme.colors.primary;
          case 'LOW':
            return props.theme.colors.text + '60';
          default:
            return props.theme.colors.text + '40';
        }
      }} 0%,
      transparent 100%);
    opacity: 0;
    transition: opacity 0.3s ease;
  }

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 20px 60px ${props => props.theme.colors.text}15,
                0 8px 20px ${props => props.theme.colors.text}10;
    border-color: ${props => props.theme.colors.primary}30;
    background: linear-gradient(135deg, ${props => props.theme.colors.background}70 0%, ${props => props.theme.colors.background}50 100%);

    &::before {
      opacity: 1;
    }
  }

  &:active {
    transform: translateY(-2px);
  }
`;

const TaskHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: ${props => props.theme.spacing.sm};
  gap: ${props => props.theme.spacing.sm};
`;

const TaskTitle = styled.h3`
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
  color: ${props => props.theme.colors.text};
  flex: 1;
  line-height: 1.4;
  letter-spacing: -0.01em;
`;

const TaskDescription = styled.p`
  color: ${props => props.theme.colors.text}80;
  font-size: 0.8125rem;
  margin: ${props => props.theme.spacing.xs} 0;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const TaskMeta = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: ${props => props.theme.spacing.sm};
`;

const Badge = styled.span<{ variant?: string }>`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 5px 10px;
  border-radius: 6px;
  font-size: 0.6875rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  background: ${props => {
    switch (props.variant) {
      case 'CRITICAL':
        return props.theme.colors.error + '18';
      case 'HIGH':
        return props.theme.colors.warning + '18';
      case 'MEDIUM':
        return props.theme.colors.primary + '18';
      case 'LOW':
        return props.theme.colors.text + '15';
      case 'APPROVED':
        return props.theme.colors.success + '18';
      case 'IN_PROGRESS':
        return props.theme.colors.primary + '18';
      case 'COMPLETED':
        return props.theme.colors.success + '18';
      case 'SUGGESTED':
        return props.theme.colors.text + '15';
      case 'REJECTED':
        return props.theme.colors.error + '18';
      case 'BLOCKED':
        return props.theme.colors.warning + '18';
      default:
        return props.theme.colors.text + '15';
    }
  }};
  color: ${props => {
    switch (props.variant) {
      case 'CRITICAL':
        return props.theme.colors.error;
      case 'HIGH':
        return props.theme.colors.warning;
      case 'MEDIUM':
        return props.theme.colors.primary;
      case 'LOW':
        return props.theme.colors.text + 'DD';
      case 'APPROVED':
        return props.theme.colors.success;
      case 'IN_PROGRESS':
        return props.theme.colors.primary;
      case 'COMPLETED':
        return props.theme.colors.success;
      case 'SUGGESTED':
        return props.theme.colors.text + 'DD';
      case 'REJECTED':
        return props.theme.colors.error;
      case 'BLOCKED':
        return props.theme.colors.warning;
      default:
        return props.theme.colors.text;
    }
  }};
  border: 1px solid ${props => {
    switch (props.variant) {
      case 'CRITICAL':
        return props.theme.colors.error + '30';
      case 'HIGH':
        return props.theme.colors.warning + '30';
      case 'MEDIUM':
        return props.theme.colors.primary + '30';
      case 'LOW':
        return props.theme.colors.text + '20';
      case 'APPROVED':
        return props.theme.colors.success + '30';
      case 'IN_PROGRESS':
        return props.theme.colors.primary + '30';
      case 'COMPLETED':
        return props.theme.colors.success + '30';
      case 'SUGGESTED':
        return props.theme.colors.text + '20';
      case 'REJECTED':
        return props.theme.colors.error + '30';
      case 'BLOCKED':
        return props.theme.colors.warning + '30';
      default:
        return props.theme.colors.text + '20';
    }
  }};
  box-shadow: 0 2px 4px ${props => props.theme.colors.text}05;
`;

const TaskFooter = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-top: ${props => props.theme.spacing.md};
  padding-top: ${props => props.theme.spacing.md};
  border-top: 1px solid ${props => props.theme.colors.text}08;
`;

const TaskInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 3px;
  font-size: 0.6875rem;
  color: ${props => props.theme.colors.text}80;
`;

const AssignedUserContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  background: ${props => props.theme.colors.primary}12;
  border-radius: 8px;
  border: 1px solid ${props => props.theme.colors.primary}25;
  box-shadow: 0 2px 4px ${props => props.theme.colors.text}05;
`;

const UserAvatar = styled.div`
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: linear-gradient(135deg, ${props => props.theme.colors.primary}40 0%, ${props => props.theme.colors.primary}60 100%);
  color: ${props => props.theme.colors.primary};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.625rem;
  font-weight: 700;
  text-transform: uppercase;
  box-shadow: 0 2px 6px ${props => props.theme.colors.primary}30;
`;

const UserName = styled.span`
  font-size: 0.75rem;
  color: ${props => props.theme.colors.text}95;
  font-weight: 600;
`;

const UnassignedLabel = styled.div`
  display: flex;
  align-items: center;
  gap: 3px;
  padding: 3px 6px;
  background: ${props => props.theme.colors.text}10;
  border-radius: 4px;
  font-size: 0.6875rem;
  color: ${props => props.theme.colors.text}60;
  font-style: italic;
`;

const AssignButton = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: ${props => props.theme.colors.primary};
  border: none;
  border-radius: 6px;
  color: white;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px ${props => props.theme.colors.primary}40;

  &:hover {
    background: ${props => props.theme.colors.primary}DD;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px ${props => props.theme.colors.primary}50;
  }

  &:active {
    transform: translateY(-1px);
  }
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: ${props => props.theme.spacing.xl};
  text-align: center;
  color: ${props => props.theme.colors.text}60;

  svg {
    margin-bottom: ${props => props.theme.spacing.md};
    color: ${props => props.theme.colors.text}40;
  }
`;

const LoaderContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
`;

const CategoryBadge = styled(Badge)`
  font-size: 0.625rem;
  text-transform: uppercase;
  letter-spacing: 0.3px;
`;

interface Task {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  category: string;
  points: number;
  estimatedHours: number;
  actualHours?: number;
  dueDate?: string;
  startedDate?: string;
  completedDate?: string;
  assignedTo?: {
    id: string;
    name: string;
    email: string;
  };
  project?: {
    id: string;
    name: string;
  };
  suggestedBy?: {
    id: string;
    name: string;
  };
  approvedBy?: {
    id: string;
    name: string;
  };
}

const formatCategory = (category: string): string => {
  return category.replace(/_/g, ' ');
};

export const Tasks: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [selectedPriority, setSelectedPriority] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'my' | 'available' | 'suggested' | null>('my');
  const [showSuggestModal, setShowSuggestModal] = useState(false);
  const [taskToAssign, setTaskToAssign] = useState<Task | null>(null);

  const { data: userData } = useQuery(ME);
  const [assignTask, { loading: assignLoading }] = useMutation(ASSIGN_TASK, {
    refetchQueries: [{ query: AVAILABLE_TASKS }],
    onCompleted: () => {
      toast.success('Task assigned successfully!');
      setTaskToAssign(null);
    },
    onError: (error) => {
      toast.error(`Failed to assign task: ${error.message}`);
    },
  });
  const { data: tasksData, loading } = useQuery(AVAILABLE_TASKS, {
    fetchPolicy: 'network-only',
  });
  const { data: projectsData } = useQuery(GET_PROJECTS);

  const tasks: Task[] = tasksData?.tasks || [];
  const projects = projectsData?.projects || [];
  const currentUserId = userData?.me?.id;

  // Filter and search tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      // Tab filter
      let matchesTab = true;
      if (activeTab === 'my') {
        matchesTab = task.assignedTo && task.assignedTo.id === currentUserId;
      } else if (activeTab === 'available') {
        matchesTab = task.status === 'APPROVED' && !task.assignedTo;
      } else if (activeTab === 'suggested') {
        matchesTab = task.status === 'SUGGESTED';
      }

      // Search filter
      const matchesSearch = !searchQuery ||
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (task.assignedTo?.name && task.assignedTo.name.toLowerCase().includes(searchQuery.toLowerCase()));

      // Project filter
      const matchesProject = !selectedProject || task.project?.id === selectedProject;

      // Status filter
      const matchesStatus = !selectedStatus || task.status === selectedStatus;

      // Priority filter
      const matchesPriority = !selectedPriority || task.priority === selectedPriority;

      return matchesTab && matchesSearch && matchesProject && matchesStatus && matchesPriority;
    });
  }, [tasks, searchQuery, selectedProject, selectedStatus, selectedPriority, activeTab, currentUserId]);


  // Separate my tasks from other tasks
  const myTasks = useMemo(() => {
    return filteredTasks.filter(task => task.assignedTo && task.assignedTo.id === currentUserId);
  }, [filteredTasks, currentUserId]);

  const otherTasks = useMemo(() => {
    return filteredTasks.filter(task => !task.assignedTo || task.assignedTo.id !== currentUserId);
  }, [filteredTasks, currentUserId]);

  // Determine the section title based on content
  const otherTasksTitle = useMemo(() => {
    const hasAssignedToOthers = otherTasks.some(task => task.assignedTo && task.assignedTo.id !== currentUserId);
    const hasUnassigned = otherTasks.some(task => !task.assignedTo);

    if (hasAssignedToOthers && hasUnassigned) {
      return 'Other Tasks';
    } else if (hasAssignedToOthers) {
      return 'Active Tasks (Assigned to Others)';
    } else {
      return 'Available Tasks';
    }
  }, [otherTasks, currentUserId]);

  // Task statistics
  const taskStats = useMemo(() => {
    const myTotal = tasks.filter(t => t.assignedTo?.id === currentUserId).length;
    const myInProgress = tasks.filter(t => t.assignedTo?.id === currentUserId && t.status === 'IN_PROGRESS').length;
    const availableTotal = tasks.filter(t => t.status === 'APPROVED' && !t.assignedTo).length;
    const suggestedTotal = tasks.filter(t => t.status === 'SUGGESTED').length;

    return {
      myTotal,
      myInProgress,
      availableTotal,
      suggestedTotal,
    };
  }, [tasks, currentUserId]);

  const handleTabClick = (tab: 'my' | 'available' | 'suggested') => {
    // Toggle: if clicking the same tab, remove filter (show all)
    setActiveTab(activeTab === tab ? null : tab);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedProject('');
    setSelectedStatus('');
    setSelectedPriority('');
    setActiveTab(null);
  };

  const hasActiveFilters = searchQuery || selectedProject || selectedStatus || selectedPriority || activeTab !== null;

  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const handleSelfAssign = (task: Task) => {
    setTaskToAssign(task);
  };

  const confirmSelfAssign = async () => {
    if (!taskToAssign || !currentUserId) return;

    try {
      await assignTask({
        variables: {
          taskId: taskToAssign.id,
          userId: currentUserId,
        },
      });
    } catch (error) {
      console.error('Error assigning task:', error);
    }
  };

  const canSelfAssign = (task: Task): boolean => {
    return task.status === 'APPROVED' && !task.assignedTo;
  };

  return (
    <Container>
      <Header
        userName={userData?.me?.name}
        userEmail={userData?.me?.email}
        onProfileEdit={() => {}}
        onLogout={() => navigate('/')}
        showBackButton
        onBack={() => navigate('/')}
        screenName="Tasks"
      />
      <MainContent>
        <FiltersBar>
          <SearchContainer>
            <SearchIcon size={18} />
            <SearchInput
              type="text"
              placeholder="Search tasks by title, description, assignee, or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </SearchContainer>

          <FilterGroup>
            <Select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
            >
              <option value="">All Projects</option>
              {projects.map((project: any) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </Select>

            <Select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="SUGGESTED">Suggested</option>
              <option value="APPROVED">Approved</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
              <option value="REJECTED">Rejected</option>
              <option value="BLOCKED">Blocked</option>
            </Select>

            <Select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
            >
              <option value="">All Priorities</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </Select>

            {hasActiveFilters && (
              <ClearFiltersButton onClick={clearFilters}>
                <X size={14} />
                Clear
              </ClearFiltersButton>
            )}
          </FilterGroup>
        </FiltersBar>

        {loading ? (
          <LoaderContainer>
            <Loader />
          </LoaderContainer>
        ) : (
          <>
            {/* Summary Cards / Tabs */}
            <SummaryCards>
              <SummaryCard
                variant="success"
                isActive={activeTab === 'my'}
                onClick={() => handleTabClick('my')}
              >
                <SummaryIconWrapper variant="success">
                  <User size={24} />
                </SummaryIconWrapper>
                <SummaryContent>
                  <SummaryLabel>My Tasks</SummaryLabel>
                  <SummaryValue>{taskStats.myTotal}</SummaryValue>
                </SummaryContent>
              </SummaryCard>

              <SummaryCard
                variant="primary"
                isActive={activeTab === 'available'}
                onClick={() => handleTabClick('available')}
              >
                <SummaryIconWrapper variant="primary">
                  <CheckSquare size={24} />
                </SummaryIconWrapper>
                <SummaryContent>
                  <SummaryLabel>Available to Assign</SummaryLabel>
                  <SummaryValue>{taskStats.availableTotal}</SummaryValue>
                </SummaryContent>
              </SummaryCard>

              <SummaryCard
                variant="info"
                isActive={activeTab === 'suggested'}
                onClick={() => handleTabClick('suggested')}
              >
                <SummaryIconWrapper variant="info">
                  <AlertCircle size={24} />
                </SummaryIconWrapper>
                <SummaryContent>
                  <SummaryLabel>Suggested Tasks</SummaryLabel>
                  <SummaryValue>{taskStats.suggestedTotal}</SummaryValue>
                </SummaryContent>
              </SummaryCard>
            </SummaryCards>

            <TopBar>
              <ResultsCount>
                Total: {filteredTasks.length} tasks
              </ResultsCount>
              <SuggestTaskButton onClick={() => setShowSuggestModal(true)}>
                <Plus size={18} />
                Suggest Task
              </SuggestTaskButton>
            </TopBar>

            {filteredTasks.length === 0 ? (
              <EmptyState>
                <CheckSquare size={64} />
                <h3>{hasActiveFilters ? 'No tasks match your filters' : 'No tasks available'}</h3>
                <p>
                  {hasActiveFilters
                    ? 'Try adjusting your search or filters to see more results.'
                    : 'Be the first to suggest a task!'}
                </p>
                {hasActiveFilters ? (
                  <ClearFiltersButton onClick={clearFilters} style={{ marginTop: '1rem' }}>
                    <X size={14} />
                    Clear Filters
                  </ClearFiltersButton>
                ) : (
                  <SuggestTaskButton onClick={() => setShowSuggestModal(true)} style={{ marginTop: '1rem' }}>
                    <Plus size={18} />
                    Suggest a Task
                  </SuggestTaskButton>
                )}
              </EmptyState>
            ) : (
              <>
                {/* My Tasks Section */}
                {myTasks.length > 0 && (
                  <>
                    <SectionHeader>
                      <SectionTitle>
                        <User size={20} />
                        My Tasks
                        <SectionCount>({myTasks.length})</SectionCount>
                      </SectionTitle>
                    </SectionHeader>
                    <TasksGrid>
                      {myTasks.map((task) => (
                        <TaskCard key={task.id} priority={task.priority}>
                          <TaskHeader>
                            <TaskTitle>{task.title}</TaskTitle>
                            <Badge variant={task.status}>{task.status.replace(/_/g, ' ')}</Badge>
                          </TaskHeader>

                          <TaskDescription>{task.description}</TaskDescription>

                          <TaskMeta>
                            <Badge variant={task.priority}>
                              <AlertCircle size={10} />
                              {task.priority}
                            </Badge>
                            <CategoryBadge>
                              {formatCategory(task.category)}
                            </CategoryBadge>
                            <Badge>
                              {task.points} pts
                            </Badge>
                            <Badge>
                              <Clock size={10} />
                              {task.estimatedHours}h
                            </Badge>
                          </TaskMeta>

                          <TaskFooter>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                              {task.assignedTo ? (
                                <AssignedUserContainer>
                                  <UserAvatar>{getInitials(task.assignedTo.name)}</UserAvatar>
                                  <UserName>{task.assignedTo.name}</UserName>
                                </AssignedUserContainer>
                              ) : canSelfAssign(task) ? (
                                <AssignButton onClick={(e) => {
                                  e.stopPropagation();
                                  handleSelfAssign(task);
                                }}>
                                  <UserPlus size={14} />
                                  Assign to Myself
                                </AssignButton>
                              ) : (
                                <UnassignedLabel>
                                  <User size={10} />
                                  Unassigned
                                </UnassignedLabel>
                              )}
                              {task.project && (
                                <TaskInfo>
                                  <Briefcase size={10} />
                                  {task.project.name}
                                </TaskInfo>
                              )}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', alignItems: 'flex-end' }}>
                              {task.dueDate && (
                                <TaskInfo>
                                  <Calendar size={10} />
                                  {new Date(task.dueDate).toLocaleDateString()}
                                </TaskInfo>
                              )}
                              {task.startedDate && task.status === 'IN_PROGRESS' && (
                                <TaskInfo style={{ color: 'inherit', opacity: 0.7 }}>
                                  <Clock size={10} />
                                  Started {new Date(task.startedDate).toLocaleDateString()}
                                </TaskInfo>
                              )}
                            </div>
                          </TaskFooter>
                        </TaskCard>
                      ))}
                    </TasksGrid>
                  </>
                )}

                {/* Other Tasks Section */}
                {otherTasks.length > 0 && (
                  <>
                    <SectionHeader>
                      <SectionTitle>
                        <CheckSquare size={20} />
                        {otherTasksTitle}
                        <SectionCount>({otherTasks.length})</SectionCount>
                      </SectionTitle>
                    </SectionHeader>
                    <TasksGrid>
                      {otherTasks.map((task) => (
                        <TaskCard key={task.id} priority={task.priority}>
                          <TaskHeader>
                            <TaskTitle>{task.title}</TaskTitle>
                            <Badge variant={task.status}>{task.status.replace(/_/g, ' ')}</Badge>
                          </TaskHeader>

                          <TaskDescription>{task.description}</TaskDescription>

                          <TaskMeta>
                            <Badge variant={task.priority}>
                              <AlertCircle size={10} />
                              {task.priority}
                            </Badge>
                            <CategoryBadge>
                              {formatCategory(task.category)}
                            </CategoryBadge>
                            <Badge>
                              {task.points} pts
                            </Badge>
                            <Badge>
                              <Clock size={10} />
                              {task.estimatedHours}h
                            </Badge>
                          </TaskMeta>

                          <TaskFooter>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                              {task.assignedTo ? (
                                <AssignedUserContainer>
                                  <UserAvatar>{getInitials(task.assignedTo.name)}</UserAvatar>
                                  <UserName>{task.assignedTo.name}</UserName>
                                </AssignedUserContainer>
                              ) : canSelfAssign(task) ? (
                                <AssignButton onClick={(e) => {
                                  e.stopPropagation();
                                  handleSelfAssign(task);
                                }}>
                                  <UserPlus size={14} />
                                  Assign to Myself
                                </AssignButton>
                              ) : (
                                <UnassignedLabel>
                                  <User size={10} />
                                  Unassigned
                                </UnassignedLabel>
                              )}
                              {task.project && (
                                <TaskInfo>
                                  <Briefcase size={10} />
                                  {task.project.name}
                                </TaskInfo>
                              )}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', alignItems: 'flex-end' }}>
                              {task.dueDate && (
                                <TaskInfo>
                                  <Calendar size={10} />
                                  {new Date(task.dueDate).toLocaleDateString()}
                                </TaskInfo>
                              )}
                              {task.startedDate && task.status === 'IN_PROGRESS' && (
                                <TaskInfo style={{ color: 'inherit', opacity: 0.7 }}>
                                  <Clock size={10} />
                                  Started {new Date(task.startedDate).toLocaleDateString()}
                                </TaskInfo>
                              )}
                            </div>
                          </TaskFooter>
                        </TaskCard>
                      ))}
                    </TasksGrid>
                  </>
                )}
              </>
            )}
          </>
        )}
      </MainContent>

      {showSuggestModal && (
        <SuggestTaskModal onClose={() => setShowSuggestModal(false)} />
      )}

      {taskToAssign && (
        <SelfAssignConfirmModal
          task={taskToAssign}
          onConfirm={confirmSelfAssign}
          onCancel={() => setTaskToAssign(null)}
          loading={assignLoading}
        />
      )}
    </Container>
  );
};
