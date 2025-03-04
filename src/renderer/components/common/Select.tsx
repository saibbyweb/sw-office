import React from 'react';
import styled from 'styled-components';

interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  required?: boolean;
  label?: string;
}

const SelectContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.xs};
`;

const Label = styled.label`
  color: ${props => props.theme.colors.text}80;
  font-size: 0.875rem;
  font-weight: 500;
`;

const StyledSelect = styled.select`
  padding: 0.75rem;
  border: 1px solid ${props => props.theme.colors.secondary}40;
  border-radius: 8px;
  font-size: 1rem;
  outline: none;
  width: 100%;
  background-color: ${props => props.theme.colors.background};
  color: ${props => props.theme.colors.text}80;
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
  background-repeat: no-repeat;
  background-position: right 0.75rem center;
  background-size: 1rem;
  padding-right: 2.5rem;
  transition: all 0.2s ease;

  &:hover:not(:disabled) {
    border-color: ${props => props.theme.colors.primary}80;
  }

  &:focus {
    border-color: ${props => props.theme.colors.primary};
    box-shadow: 0 0 0 2px ${props => props.theme.colors.primary}20;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  option {
    color: ${props => props.theme.colors.text}80;
    background-color: ${props => props.theme.colors.background};
    
    &:disabled {
      color: ${props => props.theme.colors.text}40;
    }
  }

  /* Style for placeholder option */
  option[value=""] {
    color: ${props => props.theme.colors.text}60;
  }
`;

export const Select: React.FC<SelectProps> = ({
  value,
  onChange,
  options,
  placeholder,
  required,
  label
}) => {
  return (
    <SelectContainer>
      {label && <Label>{label}</Label>}
      <StyledSelect
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
      >
        {placeholder && (
          <option value="">{placeholder}</option>
        )}
        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
            disabled={option.disabled}
          >
            {option.label}
          </option>
        ))}
      </StyledSelect>
    </SelectContainer>
  );
}; 