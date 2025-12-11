import React, { useState } from 'react';
import styled from 'styled-components';
import { Plus, X, Link as LinkIcon, Edit2, ExternalLink } from 'react-feather';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const HeaderRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
`;

const Label = styled.label`
  font-size: 14px;
  font-weight: 500;
  color: ${props => props.theme.colors.text};
`;

const EditButton = styled.button`
  padding: 6px 12px;
  border: none;
  border-radius: 6px;
  background: ${props => props.theme.colors.primary}20;
  color: ${props => props.theme.colors.primary};
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 500;
  transition: all 0.2s;
  border: 1px solid ${props => props.theme.colors.primary}30;

  &:hover {
    background: ${props => props.theme.colors.primary}30;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ReadOnlyContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const ReadOnlyLink = styled.a`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border: 1px solid ${props => props.theme.colors.text}20;
  border-radius: 8px;
  background: ${props => props.theme.colors.background};
  color: ${props => props.theme.colors.primary};
  font-size: 14px;
  text-decoration: none;
  transition: all 0.2s;
  word-break: break-all;

  &:hover {
    background: ${props => props.theme.colors.text}05;
    border-color: ${props => props.theme.colors.primary}40;
  }

  svg {
    flex-shrink: 0;
  }
`;

const EmptyState = styled.div`
  padding: 12px;
  color: ${props => props.theme.colors.text}60;
  font-size: 14px;
  font-style: italic;
`;

const LinkInputRow = styled.div`
  display: flex;
  gap: 8px;
  align-items: flex-start;
`;

const InputWrapper = styled.div`
  flex: 1;
  position: relative;
`;

const Input = styled.textarea<{ hasError?: boolean }>`
  width: 100%;
  padding: 10px 12px 10px 36px;
  min-height: 60px;
  border: 1px solid ${props => props.hasError ? props.theme.colors.error : props.theme.colors.text}30;
  border-radius: 8px;
  background: ${props => props.theme.colors.background};
  color: ${props => props.theme.colors.text};
  font-size: 14px;
  line-height: 1.5;
  transition: border-color 0.2s;
  resize: vertical;
  font-family: inherit;

  &:focus {
    outline: none;
    border-color: ${props => props.hasError ? props.theme.colors.error : props.theme.colors.primary};
  }

  &::placeholder {
    color: ${props => props.theme.colors.text}50;
  }
`;

const IconWrapper = styled.div`
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: ${props => props.theme.colors.text}60;
  pointer-events: none;
`;

const ErrorText = styled.span`
  font-size: 12px;
  color: ${props => props.theme.colors.error};
  margin-top: 4px;
  display: block;
`;

const IconButton = styled.button`
  padding: 10px;
  border: none;
  border-radius: 8px;
  background: ${props => props.theme.colors.background};
  color: ${props => props.theme.colors.text};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  border: 1px solid ${props => props.theme.colors.text}30;

  &:hover {
    background: ${props => props.theme.colors.text}10;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const AddButton = styled(IconButton)`
  background: ${props => props.theme.colors.primary}20;
  color: ${props => props.theme.colors.primary};
  border-color: ${props => props.theme.colors.primary}30;

  &:hover {
    background: ${props => props.theme.colors.primary}30;
  }
`;

const RemoveButton = styled(IconButton)`
  background: ${props => props.theme.colors.error}20;
  color: ${props => props.theme.colors.error};
  border-color: ${props => props.theme.colors.error}30;

  &:hover {
    background: ${props => props.theme.colors.error}30;
  }
`;

interface PrLinksInputProps {
  value: string[];
  onChange: (links: string[]) => void;
  disabled?: boolean;
  hasExistingLinks?: boolean;
  readOnly?: boolean;
}

const isValidUrl = (url: string): boolean => {
  if (!url.trim()) return true; // Empty is valid (will be filtered out)

  try {
    // Check if it's a valid URL format
    const urlPattern = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
    return urlPattern.test(url);
  } catch {
    return false;
  }
};

export const PrLinksInput: React.FC<PrLinksInputProps> = ({ value, onChange, disabled, hasExistingLinks = false, readOnly = false }) => {
  const [errors, setErrors] = useState<{ [key: number]: string }>({});
  const [isEditing, setIsEditing] = useState(!hasExistingLinks);

  const handleLinkChange = (index: number, newValue: string) => {
    const newLinks = [...value];
    newLinks[index] = newValue;
    onChange(newLinks);

    // Validate URL
    if (newValue && !isValidUrl(newValue)) {
      setErrors({ ...errors, [index]: 'Please enter a valid URL' });
    } else {
      const newErrors = { ...errors };
      delete newErrors[index];
      setErrors(newErrors);
    }
  };

  const handleAddLink = () => {
    onChange([...value, '']);
  };

  const handleRemoveLink = (index: number) => {
    const newLinks = value.filter((_, i) => i !== index);
    onChange(newLinks);

    // Remove error for this index
    const newErrors = { ...errors };
    delete newErrors[index];
    setErrors(newErrors);
  };

  const handleEditClick = () => {
    setIsEditing(true);
  };

  // Filter out empty links for display
  const displayLinks = value.filter(link => link.trim() !== '');

  // Show read-only view if has existing links and not editing, or if readOnly is true
  if ((hasExistingLinks && !isEditing) || readOnly) {
    return (
      <Container>
        <HeaderRow>
          <Label>PR Links</Label>
          {!readOnly && (
            <EditButton onClick={handleEditClick} disabled={disabled} type="button">
              <Edit2 size={14} />
              Edit
            </EditButton>
          )}
        </HeaderRow>
        {displayLinks.length > 0 ? (
          <ReadOnlyContainer>
            {displayLinks.map((link, index) => (
              <ReadOnlyLink
                key={index}
                href={link}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
              >
                <LinkIcon size={14} />
                <span>{link}</span>
                <ExternalLink size={12} style={{ marginLeft: 'auto' }} />
              </ReadOnlyLink>
            ))}
          </ReadOnlyContainer>
        ) : (
          <EmptyState>No PR links added yet</EmptyState>
        )}
      </Container>
    );
  }

  // Ensure at least one input is shown in edit mode
  const links = value.length > 0 ? value : [''];

  return (
    <Container>
      <Label>PR Links</Label>
      {links.map((link, index) => (
        <div key={index}>
          <LinkInputRow>
            <InputWrapper>
              <IconWrapper>
                <LinkIcon size={16} />
              </IconWrapper>
              <Input
                placeholder="https://github.com/user/repo/pull/123"
                value={link}
                onChange={(e) => handleLinkChange(index, e.target.value)}
                disabled={disabled}
                hasError={!!errors[index]}
                rows={2}
              />
              {errors[index] && <ErrorText>{errors[index]}</ErrorText>}
            </InputWrapper>
            {links.length > 1 && (
              <RemoveButton
                type="button"
                onClick={() => handleRemoveLink(index)}
                disabled={disabled}
                title="Remove link"
              >
                <X size={16} />
              </RemoveButton>
            )}
            {index === links.length - 1 && (
              <AddButton
                type="button"
                onClick={handleAddLink}
                disabled={disabled || !!errors[index]}
                title="Add another link"
              >
                <Plus size={16} />
              </AddButton>
            )}
          </LinkInputRow>
        </div>
      ))}
    </Container>
  );
};
