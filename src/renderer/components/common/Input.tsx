import React from 'react';
import styled from 'styled-components';

const InputContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.xs};
`;

const Label = styled.label`
  color: ${props => props.theme.colors.text}80;
  font-size: 0.875rem;
  font-weight: 500;
`;

const StyledInput = styled.input`
  width: 100%;
  padding: ${props => props.theme.spacing.md};
  background: ${props => props.theme.colors.background}40;
  border: 1px solid ${props => props.theme.colors.background}30;
  border-radius: 12px;
  color: ${props => props.theme.colors.text};
  font-size: 0.9375rem;
  transition: all 0.2s ease-in-out;
  backdrop-filter: blur(8px);

  &:focus {
    outline: none;
    border-color: ${props => props.theme.colors.primary}60;
    background: ${props => props.theme.colors.background}60;
    box-shadow: 0 0 0 2px ${props => props.theme.colors.primary}20;
  }

  &::placeholder {
    color: ${props => props.theme.colors.text}40;
  }

  &:hover {
    border-color: ${props => props.theme.colors.primary}40;
    background: ${props => props.theme.colors.background}50;
  }
`;

interface InputProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
}

export const Input: React.FC<InputProps> = ({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  required
}) => {
  return (
    <InputContainer>
      {label && <Label>{label}</Label>}
      <StyledInput
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
      />
    </InputContainer>
  );
}; 