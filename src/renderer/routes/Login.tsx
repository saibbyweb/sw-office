import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LoginScreen } from '../components/screens/LoginScreen';

export const Login: React.FC = () => {
  const navigate = useNavigate();

  const handleLoginSuccess = (token: string) => {
    localStorage.setItem('authToken', token);
    navigate('/');
  };

  return (
    <LoginScreen onLoginSuccess={handleLoginSuccess} />
  );
}; 