import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { Home, Clock, Users } from 'react-feather';

const Nav = styled.nav`
  display: flex;
  gap: 1rem;
  padding: 1rem;
`;

const NavLink = styled(Link)<{ active?: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  color: ${({ active, theme }) => active ? theme.colors.primary : theme.colors.text};
  text-decoration: none;
  border-radius: 8px;
  background-color: ${({ active, theme }) => active ? theme.colors.primary + '10' : 'transparent'};

  &:hover {
    background-color: ${({ theme }) => theme.colors.primary + '20'};
  }
`;

export const Navigation: React.FC = () => {
  const location = useLocation();

  return (
    <Nav>
      <NavLink to="/" active={location.pathname === '/'}>
        <Home size={18} />
        Home
      </NavLink>
      <NavLink to="/history" active={location.pathname === '/history'}>
        <Clock size={18} />
        History
      </NavLink>
      <NavLink to="/teams" active={location.pathname === '/teams'}>
        <Users size={18} />
        Team
      </NavLink>
    </Nav>
  );
}; 