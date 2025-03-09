import React from 'react';
import { VirtualOffice } from '../components/VirtualOffice';
import styled from 'styled-components';

const BackButton = styled.button`
  position: absolute;
  top: 20px;
  left: 20px;
  z-index: 10;
  padding: 0.5rem 1rem;
  background: ${props => props.theme.colors.background}CC;
  border: none;
  border-radius: 8px;
  color: ${props => props.theme.colors.text};
  backdrop-filter: blur(10px);
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  
  &:hover {
    background: ${props => props.theme.colors.background};
  }
`;

export const Teams: React.FC = () => {
  return (
    <>
      <VirtualOffice />
    </>
  );
}; 