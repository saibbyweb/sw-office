import React from 'react';
import styled from 'styled-components';
import { gql, useQuery } from '@apollo/client';
import { Card } from '../components/common/Card';
import { Loader } from '../components/common/Loader';
import { useNavigate } from 'react-router-dom';

const TEAM_USERS_QUERY = gql`
  query GetTeamUsers {
    teamUsers {
      id
      name
      email
      role
      avatarUrl
      isOnline
      currentStatus
    }
  }
`;

const TeamsContainer = styled.div`
  padding: 2rem;
`;

const TeamsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-top: 1.5rem;
`;

const UserCard = styled(Card)`
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
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
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background-color: ${({ theme }) => theme.colors.background};
  border: 1px solid ${({ theme }) => theme.colors.textLight};
  border-radius: 8px;
  color: ${({ theme }) => theme.colors.text};
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

  &:hover {
    background-color: ${({ theme }) => `${theme.colors.primary}10`};
    transform: translateY(-1px);
  }

  &::before {
    content: '←';
    font-size: 1.2rem;
  }
`;

export const Teams: React.FC = () => {
  const { loading, error, data } = useQuery(TEAM_USERS_QUERY);
  const navigate = useNavigate();

  if (loading) return <Loader />;
  if (error) return <div>Error loading team members</div>;

  return (
    <TeamsContainer>
      <BackButton onClick={() => navigate(-1)}>Back</BackButton>
      <h1>Team Members</h1>
      <TeamsGrid>
        {data?.teamUsers.map((user: any) => (
          <UserCard key={user.id}>
            <UserInfo>
              <UserAvatar url={user.avatarUrl} />
              <UserDetails>
                <UserName>{user.name}</UserName>
                <UserEmail>{user.email}</UserEmail>
              </UserDetails>
            </UserInfo>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <UserRole>{user.role}</UserRole>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <StatusIndicator isOnline={user.isOnline} />
                {user.currentStatus || (user.isOnline ? 'Online' : 'Offline')}
              </div>
            </div>
          </UserCard>
        ))}
      </TeamsGrid>
    </TeamsContainer>
  );
}; 