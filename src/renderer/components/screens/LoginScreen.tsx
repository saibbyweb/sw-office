import React, { useState } from 'react';
import styled from 'styled-components';
import { useMutation } from '@apollo/client';
import { gql } from '@apollo/client';
import { Button, Input } from '../common';

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
  padding: ${props => props.theme.spacing.xl};
`;

const LoginForm = styled.form`
  width: 100%;
  max-width: 400px;
  padding: ${props => props.theme.spacing.xl};
  background: ${props => props.theme.colors.background}80;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.lg};
`;

const Title = styled.h1`
  margin: 0;
  color: ${props => props.theme.colors.text};
  font-size: 2rem;
  font-weight: 600;
  text-align: center;
`;

const ErrorMessage = styled.div`
  color: ${props => props.theme.colors.error};
  font-size: 0.875rem;
  text-align: center;
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
      <LoginForm onSubmit={handleSubmit}>
        <Title>Welcome Back</Title>

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

        {error && <ErrorMessage>{error}</ErrorMessage>}

        <Button type="submit" isLoading={loading}>
          Log In
        </Button>
      </LoginForm>
    </Container>
  );
}; 