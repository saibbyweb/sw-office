import React, { useState } from 'react';
import styled from 'styled-components';
import { gql, useQuery } from '@apollo/client';
import { Card } from '../components/common/Card';
import { Loader } from '../components/common/Loader';
import { useNavigate } from 'react-router-dom';
import { AlertCircle } from 'react-feather';
import { useCall } from '../../components/CallProvider';
import toast from 'react-hot-toast';

const TEAM_USERS_QUERY = gql`
  query GetTeamUsers {
    me {
      id
      name
      email
      role
      avatarUrl
      isOnline
      currentStatus
    }
    getUsers {
      id
      name
      email
    }
  }
`;

const TeamsContainer = styled.div`
  padding: 4rem 2rem 2rem;
  position: relative;
  height: 100vh;
  z-index: 1;
  background-color: ${props => props.theme.colors.background};
  overflow: hidden;
  display: flex;
  flex-direction: column;

  &::before {
    content: '';
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(
      45deg,
      ${props => props.theme.colors.background},
      ${props => `${props.theme.colors.primary}30`},
      ${props => `${props.theme.colors.info}25`},
      ${props => props.theme.colors.background}
    );
    background-size: 400% 400%;
    animation: gradient 15s ease infinite;
    z-index: 0;
  }

  & > * {
    position: relative;
    z-index: 1;
  }

  @keyframes gradient {
    0% {
      background-position: 0% 50%;
    }
    50% {
      background-position: 100% 50%;
    }
    100% {
      background-position: 0% 50%;
    }
  }
`;

const ScrollableContent = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 0 3.5rem;
  
  /* Custom scrollbar styles */
  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-track {
    background: ${({ theme }) => theme.colors.background};
  }

  &::-webkit-scrollbar-thumb {
    background: ${({ theme }) => `${theme.colors.primary}40`};
    border-radius: 4px;
  }

  &::-webkit-scrollbar-thumb:hover {
    background: ${({ theme }) => `${theme.colors.primary}60`};
  }
`;

const PageHeader = styled.div`
  margin-left: 3.5rem;
  margin-bottom: 2rem;

  h1 {
    margin: 0;
    font-size: 2rem;
    color: ${({ theme }) => theme.colors.text};
  }
`;

const TeamsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 1rem;
  padding-bottom: 2rem;
`;

const UserCard = styled(Card)`
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px ${({ theme }) => theme.colors.primary}20;
  }
`;

const UserAvatar = styled.div<{ url?: string }>`
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background-color: ${({ theme }) => theme.colors.primary};
  background-image: ${({ url }) => url ? `url(${url})` : 'none'};
  background-size: cover;
  background-position: center;
`;

const UserInfo = styled.div`
  display: flex;
  gap: 1rem;
  align-items: center;
`;

const UserDetails = styled.div`
  flex: 1;
`;

const UserName = styled.h3`
  margin: 0;
  font-size: 1.1rem;
  color: ${({ theme }) => theme.colors.text};
`;

const UserEmail = styled.p`
  margin: 0.25rem 0 0;
  font-size: 0.9rem;
  color: ${({ theme }) => theme.colors.textLight};
`;

const UserRole = styled.span`
  font-size: 0.8rem;
  padding: 0.25rem 0.5rem;
  background-color: ${({ theme }) => theme.colors.primary}20;
  color: ${({ theme }) => theme.colors.primary};
  border-radius: 12px;
`;

const StatusIndicator = styled.div<{ isOnline?: boolean }>`
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background-color: ${({ isOnline, theme }) => 
    isOnline ? theme.colors.success : theme.colors.textLight};
  margin-right: 0.5rem;
`;

const BackButton = styled.button`
  position: fixed;
  top: 2rem;
  left: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background-color: ${({ theme }) => theme.colors.background};
  border: 1px solid ${({ theme }) => theme.colors.textLight};
  border-radius: 8px;
  color: ${({ theme }) => theme.colors.text};
  font-size: 1.2rem;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  z-index: 2;

  &:hover {
    background-color: ${({ theme }) => `${theme.colors.primary}10`};
    transform: translateY(-1px);
  }

  &::before {
    content: '←';
  }
`;

const ErrorContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  text-align: center;
  padding: 2rem;
  color: ${({ theme }) => theme.colors.text};
`;

const ErrorIcon = styled.div`
  color: ${({ theme }) => theme.colors.error};
  margin-bottom: 1rem;
  svg {
    width: 48px;
    height: 48px;
  }
`;

const ErrorMessage = styled.h2`
  margin: 0;
  font-size: 1.5rem;
  color: ${({ theme }) => theme.colors.text};
`;

const ErrorDescription = styled.p`
  margin: 1rem 0;
  font-size: 1.1rem;
  color: ${({ theme }) => theme.colors.textLight};
  max-width: 500px;
`;

const RetryButton = styled.button`
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  background-color: ${({ theme }) => theme.colors.primary};
  color: white;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-1px);
    background-color: ${({ theme }) => `${theme.colors.primary}ee`};
  }
`;

const InviteButton = styled.button<{ isLoading?: boolean }>`
  margin-top: 0.5rem;
  padding: 0.5rem;
  border: none;
  border-radius: 6px;
  background-color: ${({ theme, isLoading }) => 
    isLoading ? theme.colors.primary + '40' : theme.colors.primary + '15'};
  color: ${({ theme }) => theme.colors.primary};
  font-size: 0.9rem;
  cursor: ${({ isLoading }) => isLoading ? 'not-allowed' : 'pointer'};
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;

  &:hover {
    background-color: ${({ theme, isLoading }) => 
      isLoading ? theme.colors.primary + '40' : theme.colors.primary + '25'};
    transform: ${({ isLoading }) => isLoading ? 'none' : 'translateY(-1px)'};
  }

  &:active {
    transform: ${({ isLoading }) => isLoading ? 'none' : 'translateY(0)'};
  }
`;

const LoadingSpinner = styled.div`
  width: 16px;
  height: 16px;
  border: 2px solid ${({ theme }) => theme.colors.primary}40;
  border-top-color: ${({ theme }) => theme.colors.primary};
  border-radius: 50%;
  animation: spin 0.8s linear infinite;

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;

interface TeamUser {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
}

export const Teams: React.FC = () => {
  const { loading, error, data, refetch } = useQuery(TEAM_USERS_QUERY);
  const navigate = useNavigate();
  const { initiateCall } = useCall();
  const [callingUserId, setCallingUserId] = useState<string | null>(null);

  const handleInviteClick = async (user: TeamUser) => {
    if (!user.id) {
      toast.error('Cannot initiate call: User ID not found');
      return;
    }

    setCallingUserId(user.id);
    
    try {
      // Show initiating call toast
      toast.loading('Initiating call...', {
        id: `call-${user.id}`,
      });

      // Initiate the call with MongoDB user ID
      await initiateCall(user.id);

      // Update toast to show call initiated
      toast.success('Call initiated! Waiting for response...', {
        id: `call-${user.id}`,
        duration: 3000,
      });
    } catch (error) {
      console.error('Failed to initiate call:', error);
      toast.error('Failed to initiate call. Please try again.', {
        id: `call-${user.id}`,
      });
    } finally {
      setCallingUserId(null);
    }
  };

  if (loading) {
    return (
      <TeamsContainer>
        <BackButton onClick={() => navigate(-1)} aria-label="Go back" />
        <PageHeader>
          <h1>Team Members</h1>
        </PageHeader>
        <Loader />
      </TeamsContainer>
    );
  }

  if (error) {
    return (
      <TeamsContainer>
        <BackButton onClick={() => navigate(-1)} aria-label="Go back" />
        <PageHeader>
          <h1>Team Members</h1>
        </PageHeader>
        <ErrorContainer>
          <ErrorIcon>
            <AlertCircle />
          </ErrorIcon>
          <ErrorMessage>Unable to Load Team Members</ErrorMessage>
          <ErrorDescription>
            We encountered an error while trying to fetch the team members. This might be due to a connection issue or server problem.
          </ErrorDescription>
          <RetryButton onClick={() => refetch()}>
            Try Again
          </RetryButton>
        </ErrorContainer>
      </TeamsContainer>
    );
  }

  return (
    <TeamsContainer>
      <BackButton onClick={() => navigate(-1)} aria-label="Go back" />
      <PageHeader>
        <h1>Team Members</h1>
      </PageHeader>
      <ScrollableContent>
        <TeamsGrid>
          {data?.getUsers.map((user: TeamUser) => (
            <UserCard key={user.id}>
              <UserInfo>
                <UserAvatar url={user.avatarUrl} />
                <UserDetails>
                  <UserName>{user.name}</UserName>
                  <UserEmail>{user.email}</UserEmail>
                </UserDetails>
              </UserInfo>
              <UserRole>{user.email}</UserRole>
              <InviteButton 
                onClick={() => handleInviteClick(user)}
                disabled={callingUserId === user.id}
                isLoading={callingUserId === user.id}
              >
                {callingUserId === user.id ? (
                  <>
                    <LoadingSpinner />
                    Initiating Call...
                  </>
                ) : (
                  'Invite for Meeting'
                )}
              </InviteButton>
            </UserCard>
          ))}
        </TeamsGrid>
      </ScrollableContent>
    </TeamsContainer>
  );
}; 