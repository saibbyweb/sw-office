import React from 'react';
import styled, { keyframes } from 'styled-components';

const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

interface StyledButtonProps {
  variant?: 'primary' | 'secondary' | 'warning' | 'error';
  size?: 'small' | 'medium' | 'large';
  isLoading?: boolean;
}

const getBackgroundColor = (variant: string, theme: any) => {
  switch (variant) {
    case 'secondary':
      return `${theme.colors.background}30`;
    case 'warning':
      return theme.colors.warning;
    case 'error':
      return theme.colors.error;
    default:
      return theme.colors.primary;
  }
};

const getBorderColor = (variant: string, theme: any) => {
  switch (variant) {
    case 'secondary':
      return `${theme.colors.background}40`;
    case 'warning':
      return theme.colors.warning;
    case 'error':
      return theme.colors.error;
    default:
      return theme.colors.primary;
  }
};

const getHoverBackground = (variant: string, theme: any) => {
  switch (variant) {
    case 'secondary':
      return `${theme.colors.background}40`;
    case 'warning':
      return `${theme.colors.warning}90`;
    case 'error':
      return `${theme.colors.error}90`;
    default:
      return `${theme.colors.primary}90`;
  }
};

const StyledButton = styled.button<StyledButtonProps>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: ${props => props.theme.spacing.sm};
  padding: ${props => props.size === 'small' 
    ? `${props.theme.spacing.sm} ${props.theme.spacing.md}` 
    : `${props.theme.spacing.md} ${props.theme.spacing.lg}`};
  background: ${props => getBackgroundColor(props.variant || 'primary', props.theme)};
  color: ${props => props.variant === 'secondary' ? props.theme.colors.text : '#fff'};
  border: 1px solid ${props => getBorderColor(props.variant || 'primary', props.theme)};
  border-radius: 12px;
  font-size: ${props => props.size === 'small' ? '0.875rem' : '0.9375rem'};
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  backdrop-filter: ${props => props.variant === 'secondary' ? 'blur(8px)' : 'none'};
  opacity: ${props => props.isLoading ? 0.8 : 1};
  position: relative;
  overflow: hidden;

  &:hover {
    background: ${props => getHoverBackground(props.variant || 'primary', props.theme)};
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    pointer-events: none;
  }

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(
      45deg,
      transparent 25%,
      rgba(255, 255, 255, 0.1) 50%,
      transparent 75%
    );
    background-size: 200% 200%;
    animation: shimmer 2s infinite linear;
    opacity: ${props => props.isLoading ? 1 : 0};
    pointer-events: none;
  }

  @keyframes shimmer {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }
`;

const LoadingSpinner = styled.div`
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: ${spin} 0.8s linear infinite;
  margin-right: ${props => props.theme.spacing.sm};
`;

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'warning' | 'error';
  size?: 'small' | 'medium' | 'large';
  isLoading?: boolean;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'medium',
  isLoading = false,
  children,
  ...props
}) => {
  return (
    <StyledButton
      variant={variant}
      size={size}
      isLoading={isLoading}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading && <LoadingSpinner />}
      {children}
    </StyledButton>
  );
}; 