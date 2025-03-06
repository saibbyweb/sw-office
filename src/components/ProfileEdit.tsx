import React, { useState, useCallback } from 'react';
import { gql, useMutation } from '@apollo/client';
import { toast } from 'react-hot-toast';
import styled from 'styled-components';
import { Modal } from '../renderer/components/common';
import { API_HOST } from '../services/env';

const UPDATE_PROFILE = gql`
  mutation UpdateProfile($input: UpdateProfileInput!) {
    updateProfile(input: $input) {
      id
      name
      avatarUrl
    }
  }
`;

const ModalContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const Title = styled.h2`
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 1rem;
  color: ${props => props.theme.colors.text};
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const AvatarSection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
`;

const AvatarContainer = styled.div`
  position: relative;
`;

const AvatarImage = styled.img`
  width: 6rem;
  height: 6rem;
  border-radius: 50%;
  object-fit: cover;
`;

const AvatarUploadLabel = styled.label`
  position: absolute;
  bottom: 0;
  right: 0;
  background-color: ${props => props.theme.colors.primary};
  color: white;
  padding: 0.5rem;
  border-radius: 50%;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: ${props => props.theme.colors.primary}dd;
  }

  svg {
    width: 1rem;
    height: 1rem;
  }
`;

const HiddenInput = styled.input`
  display: none;
`;

const InputGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const Label = styled.label`
  font-size: 0.875rem;
  font-weight: 500;
  color: ${props => props.theme.colors.text};
`;

const Input = styled.input`
  padding: 0.5rem;
  border: 1px solid ${props => props.theme.colors.text}20;
  border-radius: 0.375rem;
  background-color: ${props => props.theme.colors.background};
  color: ${props => props.theme.colors.text};
  transition: border-color 0.2s;

  &:focus {
    outline: none;
    border-color: ${props => props.theme.colors.primary};
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 1rem;
`;

const Button = styled.button<{ variant?: 'primary' | 'secondary' }>`
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  ${props => props.variant === 'primary' ? `
    background-color: ${props.theme.colors.primary};
    color: white;
    border: none;

    &:hover {
      background-color: ${props.theme.colors.primary}dd;
    }
  ` : `
    background-color: transparent;
    color: ${props.theme.colors.text};
    border: 1px solid ${props.theme.colors.text}20;

    &:hover {
      background-color: ${props.theme.colors.text}10;
    }
  `}

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
`;

interface ProfileEditProps {
  currentName: string;
  currentAvatarUrl?: string;
  onClose: () => void;
  isOpen: boolean;
}

export const ProfileEdit: React.FC<ProfileEditProps> = ({
  currentName,
  currentAvatarUrl,
  onClose,
  isOpen,
}) => {
  const [name, setName] = useState(currentName);
  const [avatarUrl, setAvatarUrl] = useState(currentAvatarUrl ? API_HOST + currentAvatarUrl : '');
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(currentAvatarUrl ? currentAvatarUrl : '');

  const [updateProfile] = useMutation(UPDATE_PROFILE, {
    onCompleted: () => {
      toast.success('Profile updated successfully!');
      onClose();
    },
    onError: (error) => {
      toast.error(`Failed to update profile: ${error.message}`);
    },
  });

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    setIsUploading(true);
    try {
      // Create preview URL for immediate feedback
      const preview = URL.createObjectURL(file);
      setPreviewUrl(preview);

      // Create form data
      const formData = new FormData();
      formData.append('file', file);

      // Upload file
      const response = await fetch(API_HOST + '/upload/profile-picture', {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to upload image');
      }

      const data = await response.json();
      // Store the complete URL for the avatar
      const fullUrl = API_HOST + data.url;
      setAvatarUrl(fullUrl);
      setPreviewUrl(fullUrl); // Update preview with the actual URL
    } catch (error) {
      toast.error('Failed to upload image');
      console.error('Upload error:', error);
      // Reset preview on error
      setPreviewUrl(currentAvatarUrl ? API_HOST + currentAvatarUrl : '');
    } finally {
      setIsUploading(false);
    }
  }, [currentAvatarUrl]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Name is required');
      return;
    }

    await updateProfile({
      variables: {
        input: {
          name: name.trim(),
          avatarUrl,
        },
      },
    });
  }, [name, avatarUrl, updateProfile]);

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalContent>
        <Title>Edit Profile</Title>
        <Form onSubmit={handleSubmit}>
          <AvatarSection>
            <AvatarContainer>
              <AvatarImage
                src={previewUrl || 'default-avatar.png'}
                alt="Profile"
              />
              <AvatarUploadLabel htmlFor="avatar-upload">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </AvatarUploadLabel>
              <HiddenInput
                type="file"
                id="avatar-upload"
                accept="image/*"
                onChange={handleFileChange}
                disabled={isUploading}
              />
            </AvatarContainer>
            {isUploading && <span>Uploading...</span>}
          </AvatarSection>

          <InputGroup>
            <Label htmlFor="name">Name</Label>
            <Input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              minLength={2}
            />
          </InputGroup>

          <ButtonGroup>
            <Button type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={isUploading}>
              Save Changes
            </Button>
          </ButtonGroup>
        </Form>
      </ModalContent>
    </Modal>
  );
}; 