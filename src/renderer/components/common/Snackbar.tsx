import React, { useEffect } from 'react';
import styled, { keyframes, css } from 'styled-components';

const slideIn = keyframes`
  from {
    transform: translateY(100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
`;

const slideOut = keyframes`
  from {
    transform: translateY(0);
    opacity: 1;
  }
  to {
    transform: translateY(100%);
    opacity: 0;
  }
`;

const SnackbarContainer = styled.div<{ type: 'success' | 'error'; show: boolean }>`
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  padding: 12px 24px;
  border-radius: 8px;
  color: white;
  font-size: 0.875rem;
  display: flex;
  align-items: center;
  gap: 8px;
  z-index: 1000;
  animation: ${props => props.show ? css`${slideIn} 0.3s ease-out` : css`${slideOut} 0.3s ease-out`};
  
  ${props => props.type === 'success' && css`
    background-color: ${props.theme.colors.success};
  `}
  
  ${props => props.type === 'error' && css`
    background-color: ${props.theme.colors.error};
  `}
`;

const Icon = styled.span`
  font-size: 1.25rem;
`;

interface SnackbarProps {
  message: string;
  type: 'success' | 'error';
  show: boolean;
  onClose: () => void;
  duration?: number;
}

export const Snackbar: React.FC<SnackbarProps> = ({ 
  message, 
  type, 
  show, 
  onClose, 
  duration = 3000 
}) => {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [show, duration, onClose]);

  if (!show) return null;

  return (
    <SnackbarContainer type={type} show={show}>
      <Icon>{type === 'success' ? '✓' : '✕'}</Icon>
      {message}
    </SnackbarContainer>
  );
}; 