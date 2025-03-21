import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@apollo/client';
import styled from 'styled-components';
import { VirtualOffice } from '../components/VirtualOffice';
import { Header } from '../components/common/Header';
import { ME } from '../../graphql/queries';

const Container = styled.div`
  min-height: 100vh;
  background-color: ${props => props.theme.colors.background};
  color: ${props => props.theme.colors.text};
  display: flex;
  flex-direction: column;
`;

const MainContent = styled.div`
  flex: 1;
  position: relative;
`;

export const Teams: React.FC = () => {
  const navigate = useNavigate();
  const { data: userData } = useQuery(ME);

  return (
    <Container>
      <Header 
        userName={userData?.me?.name}
        userEmail={userData?.me?.email}
        onProfileEdit={() => {}}
        onLogout={() => navigate('/')}
        showBackButton
        onBack={() => navigate('/')}
        screenName="Teams"
      />
      <MainContent>
        <VirtualOffice />
      </MainContent>
    </Container>
  );
}; 