import React, { useState } from 'react';
import styled from 'styled-components';
import { useMutation } from '@apollo/client';
import { gql } from '@apollo/client';
import { Button, Input } from '../common';
const { ipcRenderer } = window.require('electron');

const LOGIN = gql`
  mutation Login($input: LoginInput!) {
    login(input: $input) {
      token
      user {
        id
        email
        name
      }
    }
  }
`;

const Container = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: ${props => props.theme.colors.background};
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: radial-gradient(
      circle at center,
      ${props => props.theme.colors.primary}10 0%,
      transparent 70%
    );
    opacity: 0.4;
    z-index: 0;
  }
`;

const LoginCard = styled.div`
  width: 100%;
  max-width: 420px;
  background: ${props => props.theme.colors.background}90;
  backdrop-filter: blur(12px);
  border-radius: 24px;
  border: 1px solid ${props => props.theme.colors.background}30;
  box-shadow: 0 8px 32px -4px ${props => props.theme.colors.primary}15;
  z-index: 1;
`;

const CardHeader = styled.div`
  padding: ${props => props.theme.spacing.xl};
  border-bottom: 1px solid ${props => props.theme.colors.background}20;
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.md};
`;

const AppIcon = styled.img`
  width: 32px;
  height: 32px;
  border-radius: 8px;
`;

const HeaderTitle = styled.div`
  flex: 1;
`;

const Title = styled.h1`
  margin: 0;
  color: ${props => props.theme.colors.text};
  font-size: 1.5rem;
  font-weight: 600;
`;

const Subtitle = styled.div`
  color: ${props => props.theme.colors.text}60;
  font-size: 0.875rem;
  margin-top: ${props => props.theme.spacing.xs};
`;

const LoginForm = styled.form`
  padding: ${props => props.theme.spacing.xl};
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.lg};
`;

const InputGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.md};
`;

const ErrorMessage = styled.div`
  color: ${props => props.theme.colors.error};
  font-size: 0.875rem;
  text-align: center;
  padding: ${props => props.theme.spacing.sm};
  background: ${props => props.theme.colors.error}10;
  border-radius: 8px;
  border: 1px solid ${props => props.theme.colors.error}20;
`;

interface LoginScreenProps {
  onLoginSuccess: (token: string) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [appIcon, setAppIcon] = useState<string>('');

  const [login, { loading }] = useMutation(LOGIN, {
    onCompleted: (data) => {
      const { token } = data.login;
      localStorage.setItem('authToken', token);
      onLoginSuccess(token);
    },
    onError: (error) => {
      setError(error.message);
    },
  });

  React.useEffect(() => {
    const loadAppIcon = async () => {
      try {
        const iconPath = await ipcRenderer.invoke('get-app-icon-path');
        setAppIcon(iconPath);
      } catch (error) {
        console.error('Failed to load app icon:', error);
      }
    };
    
    loadAppIcon();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password.trim()) {
      setError('Please fill in all fields');
      return;
    }

    try {
      await login({
        variables: {
          input: {
            email,
            password,
          },
        },
      });
    } catch (err) {
      // Error is handled by onError callback
    }
  };

  return (
    <Container>
      <LoginCard>
        <CardHeader>
          {appIcon && <AppIcon src={appIcon} alt="SW Office" />}
          <HeaderTitle>
            <Title>Welcome Back</Title>
            <Subtitle>Sign in to continue tracking your work</Subtitle>
          </HeaderTitle>
        </CardHeader>

        <LoginForm onSubmit={handleSubmit}>
          <InputGroup>
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={setEmail}
              placeholder="Enter your email"
              required
            />

            <Input
              label="Password"
              type="password"
              value={password}
              onChange={setPassword}
              placeholder="Enter your password"
              required
            />
          </InputGroup>

          {error && <ErrorMessage>{error}</ErrorMessage>}

          <Button 
            type="submit" 
            isLoading={loading}
            style={{ height: '48px', fontSize: '1rem' }}
          >
            Sign In
          </Button>
        </LoginForm>
      </LoginCard>
    </Container>
  );
}; 