import React from 'react';
import styled from 'styled-components';

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  label?: string;
  error?: string;
  onChange: (value: string) => void;
}

const InputWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.xs};
  width: 100%;
`;

const Label = styled.label`
  font-size: 0.875rem;
  font-weight: 500;
  color: ${props => props.theme.colors.text};
`;

const StyledInput = styled.input`
  padding: 0.75rem;
  border: 1px solid ${props => props.theme.colors.secondary}40;
  border-radius: 8px;
  font-size: 1rem;
  outline: none;
  transition: all 0.2s ease;
  width: 100%;

  &:focus {
    border-color: ${props => props.theme.colors.primary};
    box-shadow: 0 0 0 2px ${props => props.theme.colors.primary}20;
  }

  &:disabled {
    background-color: ${props => props.theme.colors.background}80;
    cursor: not-allowed;
  }

  &::placeholder {
    color: ${props => props.theme.colors.text}60;
  }
`;

const ErrorMessage = styled.span`
  font-size: 0.75rem;
  color: ${props => props.theme.colors.error};
`;

export const Input: React.FC<InputProps> = ({
  label,
  value,
  onChange,
  error,
  required,
  placeholder,
  type = 'text',
  ...props
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  return (
    <InputWrapper>
      {label && (
        <Label>
          {label}
          {required && <span style={{ color: 'red' }}> *</span>}
        </Label>
      )}
      <StyledInput
        type={type}
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        {...props}
      />
      {error && <ErrorMessage>{error}</ErrorMessage>}
    </InputWrapper>
  );
}; 