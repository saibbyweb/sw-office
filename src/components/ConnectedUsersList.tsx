import React from 'react';
import { useConnectedUsers } from '../contexts/ConnectedUsersContext';
import styled from 'styled-components';

const Container = styled.div`
  padding: 16px;
  border-radius: 8px;
  background-color: #f5f5f5;
  margin: 16px 0;
`;

const Title = styled.h3`
  margin-top: 0;
  margin-bottom: 12px;
  font-size: 16px;
  color: #333;
`;

const UsersList = styled.ul`
  list-style-type: none;
  padding: 0;
  margin: 0;
`;

const UserItem = styled.li`
  padding: 8px 0;
  border-bottom: 1px solid #e0e0e0;
  &:last-child {
    border-bottom: none;
  }
`;

const LoadingText = styled.p`
  color: #666;
  font-style: italic;
`;

const NoUsersText = styled.p`
  color: #666;
`;

export const ConnectedUsersList: React.FC = () => {
  const { connectedUsers, isLoading } = useConnectedUsers();

  return (
    <Container>
      <Title>Connected Users</Title>
      {isLoading ? (
        <LoadingText>Loading connected users...</LoadingText>
      ) : connectedUsers.length === 0 ? (
        <NoUsersText>No users currently connected</NoUsersText>
      ) : (
        <UsersList>
          {connectedUsers.map((userId) => (
            <UserItem key={userId}>{userId}</UserItem>
          ))}
        </UsersList>
      )}
    </Container>
  );
}; 