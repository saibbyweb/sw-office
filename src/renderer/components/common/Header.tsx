import React from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { Users, Edit2, Clock, ArrowLeft } from 'react-feather';
import { Button } from './Button';
import appIcon from '../../../assets/icon.png';

const HeaderContainer = styled.header`
  position: relative;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: ${props => props.theme.spacing.md};
  padding: ${props => props.theme.spacing.lg} ${props => props.theme.spacing.xl};
  background: ${props => props.theme.colors.background}95;
  backdrop-filter: blur(8px);
  border-bottom: 1px solid ${props => props.theme.colors.text}10;
  z-index: 1;
`;

const LogoSection = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.md};
  margin-right: auto;
`;

const BackButton = styled(Button)`
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.md};
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
`;

const AppLogo = styled.img`
  width: 48px;
  height: 48px;
  border-radius: 12px;
  transition: transform 0.2s ease;

  &:hover {
    transform: scale(1.05);
  }
`;

const ScreenName = styled.h1`
  margin: 0;
  font-size: 1.25rem;
  font-weight: 500;
  color: ${props => props.theme.colors.text};
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
  showBackButton?: boolean;
  onBack?: () => void;
  screenName?: string;
}

export const Header: React.FC<HeaderProps> = ({
  userName,
  userEmail,
  onProfileEdit,
  onLogout,
  showBackButton,
  onBack,
  screenName
}) => {
  const navigate = useNavigate();

  return (
    <HeaderContainer>
      <LogoSection>
        <AppLogo src={appIcon} alt="SW Office" />
        {showBackButton && onBack && (
          <BackButton variant="secondary" onClick={onBack}>
            <ArrowLeft size={18} />
            Back
          </BackButton>
        )}
        {screenName && <ScreenName>{screenName}</ScreenName>}
      </LogoSection>
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