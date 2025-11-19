import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@apollo/client';
import styled from 'styled-components';
import { Header } from '../components/common/Header';
import { Loader } from '../components/common/Loader';
import { SuggestTaskModal } from '../components/modals/SuggestTaskModal';
import { ME, AVAILABLE_TASKS, GET_PROJECTS } from '../../graphql/queries';
import { CheckSquare, Clock, User, Calendar, AlertCircle, Briefcase, Search, Filter, X, Plus } from 'react-feather';

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
  overflow-y: auto;
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
  margin-bottom: ${props => props.theme.spacing.md};
`;

const ResultsCount = styled.div`
  font-size: 0.875rem;
  color: ${props => props.theme.colors.text}80;
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
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: ${props => props.theme.spacing.md};
`;

const TaskCard = styled.div<{ priority?: string }>`
  position: relative;
  background: ${props => props.theme.colors.background}40;
  border: 1px solid ${props => props.theme.colors.text}10;
  border-left: 3px solid ${props => {
    switch (props.priority) {
      case 'CRITICAL':
        return props.theme.colors.error;
      case 'HIGH':
        return props.theme.colors.warning;
      case 'MEDIUM':
        return props.theme.colors.primary;
      case 'LOW':
        return props.theme.colors.text + '40';
      default:
        return props.theme.colors.text + '20';
    }
  }};
  border-radius: 8px;
  padding: ${props => props.theme.spacing.md};
  backdrop-filter: blur(12px);
  transition: all 0.2s ease;
  cursor: pointer;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 16px ${props => props.theme.colors.text}15;
    border-color: ${props => props.theme.colors.primary}40;
    background: ${props => props.theme.colors.background}50;
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
  font-size: 0.9375rem;
  font-weight: 600;
  color: ${props => props.theme.colors.text};
  flex: 1;
  line-height: 1.3;
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
  gap: 3px;
  padding: 3px 6px;
  border-radius: 4px;
  font-size: 0.6875rem;
  font-weight: 500;
  background: ${props => {
    switch (props.variant) {
      case 'CRITICAL':
        return props.theme.colors.error + '20';
      case 'HIGH':
        return props.theme.colors.warning + '20';
      case 'MEDIUM':
        return props.theme.colors.primary + '20';
      case 'LOW':
        return props.theme.colors.text + '20';
      case 'APPROVED':
        return props.theme.colors.success + '20';
      case 'IN_PROGRESS':
        return props.theme.colors.primary + '20';
      case 'COMPLETED':
        return props.theme.colors.success + '20';
      case 'SUGGESTED':
        return props.theme.colors.text + '20';
      case 'REJECTED':
        return props.theme.colors.error + '20';
      case 'BLOCKED':
        return props.theme.colors.warning + '20';
      default:
        return props.theme.colors.text + '20';
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
        return props.theme.colors.text + 'CC';
      case 'APPROVED':
        return props.theme.colors.success;
      case 'IN_PROGRESS':
        return props.theme.colors.primary;
      case 'COMPLETED':
        return props.theme.colors.success;
      case 'SUGGESTED':
        return props.theme.colors.text + 'CC';
      case 'REJECTED':
        return props.theme.colors.error;
      case 'BLOCKED':
        return props.theme.colors.warning;
      default:
        return props.theme.colors.text;
    }
  }};
`;

const TaskFooter = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-top: ${props => props.theme.spacing.sm};
  padding-top: ${props => props.theme.spacing.sm};
  border-top: 1px solid ${props => props.theme.colors.text}10;
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
  gap: 6px;
  padding: 3px 6px;
  background: ${props => props.theme.colors.primary}10;
  border-radius: 4px;
  border: 1px solid ${props => props.theme.colors.primary}20;
`;

const UserAvatar = styled.div`
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: ${props => props.theme.colors.primary}30;
  color: ${props => props.theme.colors.primary};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.625rem;
  font-weight: 600;
  text-transform: uppercase;
`;

const UserName = styled.span`
  font-size: 0.6875rem;
  color: ${props => props.theme.colors.text}90;
  font-weight: 500;
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
  const [showMyTasksOnly, setShowMyTasksOnly] = useState(false);
  const [showSuggestedOnly, setShowSuggestedOnly] = useState(false);
  const [showSuggestModal, setShowSuggestModal] = useState(false);

  const { data: userData } = useQuery(ME);
  const { data: tasksData, loading } = useQuery(AVAILABLE_TASKS, {
    fetchPolicy: 'network-only',
  });
  const { data: projectsData } = useQuery(GET_PROJECTS);

  const tasks: Task[] = tasksData?.tasks || [];
  const projects = projectsData?.projects || [];
  const currentUserId = userData?.me?.id;

  // Debug logging
  React.useEffect(() => {
    if (showMyTasksOnly && currentUserId) {
      console.log('My Tasks Filter Active:');
      console.log('Current User ID:', currentUserId);
      console.log('Tasks with assignments:', tasks.map(t => ({
        title: t.title,
        assignedTo: t.assignedTo?.id,
        assignedToName: t.assignedTo?.name,
        matches: t.assignedTo?.id === currentUserId
      })));
    }
  }, [showMyTasksOnly, currentUserId, tasks]);

  // Filter and search tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      // My tasks filter - check if task is assigned to current user
      const matchesMyTasks = !showMyTasksOnly || (task.assignedTo && task.assignedTo.id === currentUserId);

      // Suggested tasks filter
      const matchesSuggested = !showSuggestedOnly || task.status === 'SUGGESTED';

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

      return matchesMyTasks && matchesSuggested && matchesSearch && matchesProject && matchesStatus && matchesPriority;
    });
  }, [tasks, searchQuery, selectedProject, selectedStatus, selectedPriority, showMyTasksOnly, showSuggestedOnly, currentUserId]);

  // Count of tasks assigned to current user
  const myTasksCount = useMemo(() => {
    return tasks.filter(task => task.assignedTo && task.assignedTo.id === currentUserId).length;
  }, [tasks, currentUserId]);

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedProject('');
    setSelectedStatus('');
    setSelectedPriority('');
    setShowMyTasksOnly(false);
    setShowSuggestedOnly(false);
  };

  const hasActiveFilters = searchQuery || selectedProject || selectedStatus || selectedPriority || showMyTasksOnly || showSuggestedOnly;

  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
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
            <ToggleContainer onClick={() => setShowMyTasksOnly(!showMyTasksOnly)}>
              <ToggleSwitch isActive={showMyTasksOnly} />
              <ToggleLabel>My Tasks {myTasksCount > 0 && `(${myTasksCount})`}</ToggleLabel>
            </ToggleContainer>

            <ToggleContainer onClick={() => setShowSuggestedOnly(!showSuggestedOnly)}>
              <ToggleSwitch isActive={showSuggestedOnly} />
              <ToggleLabel>Suggested</ToggleLabel>
            </ToggleContainer>

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
            <TopBar>
              {filteredTasks.length > 0 && (
                <ResultsCount>
                  Showing {filteredTasks.length} of {tasks.length} tasks
                </ResultsCount>
              )}
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
              <TasksGrid>
                {filteredTasks.map((task) => (
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
            )}
          </>
        )}
      </MainContent>

      {showSuggestModal && (
        <SuggestTaskModal onClose={() => setShowSuggestModal(false)} />
      )}
    </Container>
  );
};
