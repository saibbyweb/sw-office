import React from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { Users, Edit2, Clock } from 'react-feather';
import { Button } from './Button';
import appIcon from '../../../assets/icon.png';

const HeaderContainer = styled.header`
  position: relative;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: ${props => props.theme.spacing.md};
  margin-bottom: ${props => props.theme.spacing.lg};
  z-index: 1;
`;

const AppLogo = styled.img`
  width: 48px;
  height: 48px;
  border-radius: 12px;
  margin-right: auto;
  transition: transform 0.2s ease;

  &:hover {
    transform: scale(1.05);
  }
`;

const HeaderActions = styled.div`
  display: flex;
  gap: 1rem;
  align-items: center;
`;

const TeamsButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 8px;
  background-color: ${({ theme }) => theme.colors.primary}20;
  color: ${({ theme }) => theme.colors.primary};
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: ${({ theme }) => theme.colors.primary}30;
  }
`;

const ProfileButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  border: none;
  border-radius: 8px;
  background-color: ${({ theme }) => theme.colors.primary}20;
  color: ${({ theme }) => theme.colors.primary};
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: ${({ theme }) => theme.colors.primary}30;
  }
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
  color: ${props => props.theme.colors.text}80;
  font-size: 0.875rem;
`;

interface HeaderProps {
  userName?: string;
  userEmail?: string;
  onProfileEdit: () => void;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  userName,
  userEmail,
  onProfileEdit,
  onLogout
}) => {
  const navigate = useNavigate();

  return (
    <HeaderContainer>
      <AppLogo src={appIcon} alt="SW Office" />
      <HeaderActions>
        <TeamsButton onClick={() => navigate('/teams')}>
          <Users size={18} />
          Teams
        </TeamsButton>
        <TeamsButton onClick={() => navigate('/history')}>
          <Clock size={18} />
          History
        </TeamsButton>
        <UserInfo>
          {userName} ({userEmail})
        </UserInfo>
        <ProfileButton onClick={onProfileEdit}>
          <Edit2 size={18} />
          Edit Profile
        </ProfileButton>
        <Button 
          variant="secondary" 
          onClick={onLogout}
        >
          Logout
        </Button>
      </HeaderActions>
    </HeaderContainer>
  );
}; 