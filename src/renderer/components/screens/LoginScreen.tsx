import React, { useState } from 'react';
import styled from 'styled-components';
import { useMutation } from '@apollo/client';
import { gql } from '@apollo/client';
import { Button, Input } from '../common';
import { UpdateInfo } from '../common/UpdateInfo';
import appIcon from '../../../assets/icon.png';
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
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(
      45deg,
      ${props => props.theme.colors.background},
      ${props => `${props.theme.colors.primary}30`},
      ${props => `${props.theme.colors.info}25`},
      ${props => props.theme.colors.background}
    );
    background-size: 400% 400%;
    animation: gradient 15s ease infinite;
    z-index: 0;
  }

  & > * {
    position: relative;
    z-index: 1;
  }

  @keyframes gradient {
    0% {
      background-position: 0% 50%;
    }
    50% {
      background-position: 100% 50%;
    }
    100% {
      background-position: 0% 50%;
    }
  }
`;

const LoginCard = styled.div`
  width: 100%;
  max-width: 420px;
  background: ${props => props.theme.colors.background}10;
  backdrop-filter: blur(12px);
  border-radius: 24px;
  border: 1px solid ${props => props.theme.colors.text}15;
  box-shadow: 0 8px 32px ${props => props.theme.colors.primary}40;
  z-index: 1;
  text-align: center;
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 48px ${props => props.theme.colors.primary}60;
  }
`;

const AppLogo = styled.img`
  width: 80px;
  height: 80px;
  margin: ${props => props.theme.spacing.xl} auto ${props => props.theme.spacing.md};
  border-radius: 16px;
`;

const CardHeader = styled.div`
  padding: ${props => props.theme.spacing.lg} ${props => props.theme.spacing.xl};
  border-bottom: 1px solid ${props => props.theme.colors.background}20;
`;

const HeaderTitle = styled.div`
  text-align: center;
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
        <AppLogo src={appIcon} alt="SW Office" />
        <CardHeader>
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