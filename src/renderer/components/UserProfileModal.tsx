import React from 'react';
import styled from 'styled-components';
import { useQuery } from '@apollo/client';
import { X, User as UserIcon, Clock, CheckCircle, TrendingUp, Calendar, List } from 'react-feather';
import { GET_USER_PROFILE } from '../../graphql/queries';

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  animation: fadeIn 0.2s ease;

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
`;

const ModalContainer = styled.div`
  background: ${props => props.theme.colors.background};
  border-radius: 16px;
  width: 90%;
  max-width: 900px;
  max-height: 85vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  animation: slideUp 0.3s ease;

  @keyframes slideUp {
    from {
      transform: translateY(30px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }
`;

const ModalHeader = styled.div`
  position: sticky;
  top: 0;
  background: ${props => props.theme.colors.cardBackground};
  border-bottom: 1px solid ${props => props.theme.colors.border};
  padding: 20px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  z-index: 10;
`;

const ModalTitle = styled.h2`
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: ${props => props.theme.colors.text};
`;

const CloseButton = styled.button`
  background: transparent;
  border: none;
  color: ${props => props.theme.colors.text};
  cursor: pointer;
  display: flex;
  align-items: center;
  padding: 8px;
  border-radius: 8px;
  transition: background 0.2s;

  &:hover {
    background: ${props => props.theme.colors.background};
  }
`;

const ModalContent = styled.div`
  padding: 24px;
`;

const ProfileSection = styled.div`
  display: flex;
  gap: 24px;
  margin-bottom: 32px;
  padding-bottom: 24px;
  border-bottom: 1px solid ${props => props.theme.colors.border};
`;

const AvatarSection = styled.div`
  flex-shrink: 0;
`;

const Avatar = styled.div`
  width: 120px;
  height: 120px;
  border-radius: 16px;
  background: linear-gradient(135deg, ${props => props.theme.colors.primary}, ${props => props.theme.colors.secondary});
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 3rem;
  font-weight: 600;
  color: white;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
`;

const UserDetails = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const UserName = styled.h3`
  margin: 0;
  font-size: 1.75rem;
  font-weight: 600;
  color: ${props => props.theme.colors.text};
`;

const UserEmail = styled.p`
  margin: 0;
  font-size: 0.95rem;
  color: ${props => props.theme.colors.text}80;
`;

const UserMeta = styled.div`
  display: flex;
  gap: 16px;
  margin-top: 8px;
`;

const MetaBadge = styled.div<{ variant?: 'online' | 'offline' | 'role' }>`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 500;
  background: ${props =>
    props.variant === 'online' ? '#10b98120' :
    props.variant === 'offline' ? '#ef444420' :
    props.theme.colors.primary + '20'};
  color: ${props =>
    props.variant === 'online' ? '#10b981' :
    props.variant === 'offline' ? '#ef4444' :
    props.theme.colors.primary};
`;

const StatusDot = styled.div<{ isOnline: boolean }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${props => props.isOnline ? '#10b981' : '#ef4444'};
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 16px;
  margin-bottom: 32px;
`;

const StatCard = styled.div`
  background: ${props => props.theme.colors.cardBackground};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: 12px;
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
`;

const StatIcon = styled.div<{ color: string }>`
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: ${props => props.color}20;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${props => props.color};
`;

const StatInfo = styled.div`
  flex: 1;
`;

const StatLabel = styled.div`
  font-size: 0.8rem;
  color: ${props => props.theme.colors.text}80;
  margin-bottom: 4px;
`;

const StatValue = styled.div`
  font-size: 1.5rem;
  font-weight: 700;
  color: ${props => props.theme.colors.text};
`;

const Section = styled.div`
  margin-bottom: 32px;
`;

const SectionTitle = styled.h4`
  margin: 0 0 16px 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: ${props => props.theme.colors.text};
  display: flex;
  align-items: center;
  gap: 8px;
`;

const TaskList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: 400px;
  overflow-y: auto;
`;

const TaskItem = styled.div`
  background: ${props => props.theme.colors.cardBackground};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: 8px;
  padding: 12px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: all 0.2s;

  &:hover {
    border-color: ${props => props.theme.colors.primary};
    transform: translateX(4px);
  }
`;

const TaskInfo = styled.div`
  flex: 1;
`;

const TaskTitle = styled.div`
  font-size: 0.95rem;
  font-weight: 500;
  color: ${props => props.theme.colors.text};
  margin-bottom: 4px;
`;

const TaskMeta = styled.div`
  display: flex;
  gap: 12px;
  font-size: 0.8rem;
  color: ${props => props.theme.colors.text}70;
  align-items: center;
`;

const TaskStatus = styled.span<{ status: string }>`
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
  background: ${props => {
    switch (props.status) {
      case 'COMPLETED': return '#10b98120';
      case 'IN_PROGRESS': return '#f59e0b20';
      case 'APPROVED': return '#3b82f620';
      case 'SUGGESTED': return '#8b5cf620';
      case 'BLOCKED': return '#ef444420';
      default: return props.theme.colors.border;
    }
  }};
  color: ${props => {
    switch (props.status) {
      case 'COMPLETED': return '#10b981';
      case 'IN_PROGRESS': return '#f59e0b';
      case 'APPROVED': return '#3b82f6';
      case 'SUGGESTED': return '#8b5cf6';
      case 'BLOCKED': return '#ef4444';
      default: return props.theme.colors.text;
    }
  }};
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
  color: ${props => props.theme.colors.text}80;
`;

const ErrorContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  min-height: 400px;
  color: ${props => props.theme.colors.error};
  gap: 12px;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 40px;
  color: ${props => props.theme.colors.text}60;
  font-size: 0.9rem;
`;

interface UserProfileModalProps {
  userId: string;
  onClose: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({ userId, onClose }) => {
  const { data, loading, error } = useQuery(GET_USER_PROFILE, {
    variables: { userId },
    skip: !userId,
  });

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <ModalOverlay onClick={onClose}>
        <ModalContainer onClick={(e) => e.stopPropagation()}>
          <ModalHeader>
            <ModalTitle>User Profile</ModalTitle>
            <CloseButton onClick={onClose}>
              <X size={24} />
            </CloseButton>
          </ModalHeader>
          <ModalContent>
            <LoadingContainer>Loading profile...</LoadingContainer>
          </ModalContent>
        </ModalContainer>
      </ModalOverlay>
    );
  }

  if (error || !data?.getUserProfile) {
    return (
      <ModalOverlay onClick={onClose}>
        <ModalContainer onClick={(e) => e.stopPropagation()}>
          <ModalHeader>
            <ModalTitle>User Profile</ModalTitle>
            <CloseButton onClick={onClose}>
              <X size={24} />
            </CloseButton>
          </ModalHeader>
          <ModalContent>
            <ErrorContainer>
              <UserIcon size={48} />
              <div>Failed to load user profile</div>
            </ErrorContainer>
          </ModalContent>
        </ModalContainer>
      </ModalOverlay>
    );
  }

  const user = data.getUserProfile;

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContainer onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <ModalTitle>User Profile</ModalTitle>
          <CloseButton onClick={onClose}>
            <X size={24} />
          </CloseButton>
        </ModalHeader>
        <ModalContent>
          <ProfileSection>
            <AvatarSection>
              {user.avatarUrl ? (
                <Avatar as="img" src={user.avatarUrl} alt={user.name} />
              ) : (
                <Avatar>{getInitials(user.name)}</Avatar>
              )}
            </AvatarSection>
            <UserDetails>
              <UserName>{user.name}</UserName>
              <UserEmail>{user.email}</UserEmail>
              <UserMeta>
                <MetaBadge variant={user.isOnline ? 'online' : 'offline'}>
                  <StatusDot isOnline={user.isOnline} />
                  {user.isOnline ? 'Online' : 'Offline'}
                </MetaBadge>
                <MetaBadge variant="role">
                  <UserIcon size={14} />
                  {user.role}
                </MetaBadge>
                <MetaBadge>
                  <Calendar size={14} />
                  Joined {formatDate(user.createdAt)}
                </MetaBadge>
              </UserMeta>
            </UserDetails>
          </ProfileSection>

          {user.statistics && (
            <StatsGrid>
              <StatCard>
                <StatIcon color="#3b82f6">
                  <List size={20} />
                </StatIcon>
                <StatInfo>
                  <StatLabel>Allotted Tasks</StatLabel>
                  <StatValue>{user.statistics.allottedTasks}</StatValue>
                </StatInfo>
              </StatCard>
              <StatCard>
                <StatIcon color="#10b981">
                  <CheckCircle size={20} />
                </StatIcon>
                <StatInfo>
                  <StatLabel>Completed</StatLabel>
                  <StatValue>{user.statistics.completedTasks}</StatValue>
                </StatInfo>
              </StatCard>
              <StatCard>
                <StatIcon color="#f59e0b">
                  <TrendingUp size={20} />
                </StatIcon>
                <StatInfo>
                  <StatLabel>In Progress</StatLabel>
                  <StatValue>{user.statistics.inProgressTasks}</StatValue>
                </StatInfo>
              </StatCard>
            </StatsGrid>
          )}

          <Section>
            <SectionTitle>
              <CheckCircle size={18} />
              Recent Tasks
            </SectionTitle>
            <TaskList>
              {user.taskAssignments && user.taskAssignments.length > 0 ? (
                user.taskAssignments.slice(0, 10).map((task: any) => (
                  <TaskItem key={task.id}>
                    <TaskInfo>
                      <TaskTitle>{task.title}</TaskTitle>
                      <TaskMeta>
                        <TaskStatus status={task.status}>
                          {task.status.replace(/_/g, ' ')}
                        </TaskStatus>
                        {task.project && (
                          <>
                            <span>•</span>
                            <span>{task.project.name}</span>
                          </>
                        )}
                        {task.completedDate && (
                          <>
                            <span>•</span>
                            <span>Completed {formatDate(task.completedDate)}</span>
                          </>
                        )}
                      </TaskMeta>
                    </TaskInfo>
                  </TaskItem>
                ))
              ) : (
                <EmptyState>No tasks assigned yet</EmptyState>
              )}
            </TaskList>
          </Section>
        </ModalContent>
      </ModalContainer>
    </ModalOverlay>
  );
};
