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
  padding: 4rem 2rem 2rem;
  position: relative;
  min-height: 100vh;
  z-index: 1;
  background-color: ${props => props.theme.colors.background};
  overflow: hidden;

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
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1rem;
`;

const UserCard = styled(Card)`
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
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

export const Teams: React.FC = () => {
  const { loading, error, data } = useQuery(TEAM_USERS_QUERY);
  const navigate = useNavigate();

  if (loading) return <Loader />;
  if (error) return <div>Error loading team members</div>;

  return (
    <TeamsContainer>
      <BackButton onClick={() => navigate(-1)} aria-label="Go back" />
      <PageHeader>
        <h1>Team Members</h1>
      </PageHeader>
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
            <UserRole>{user.role}</UserRole>
          </UserCard>
        ))}
      </TeamsGrid>
    </TeamsContainer>
  );
}; 