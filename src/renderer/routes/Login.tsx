import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LoginScreen } from '../components/screens/LoginScreen';
import { notificationService } from '../../services/NotificationService';

export const Login: React.FC = () => {
  const navigate = useNavigate();

  const handleLoginSuccess = (token: string) => {
    console.log('[Login] Login successful, setting auth token');
    localStorage.setItem('authToken', token);
    
    // Dispatch a custom event to notify that authentication has changed
    window.dispatchEvent(new Event('auth-changed'));
    
    // Connect to socket after successful login
    console.log('[Login] Connecting to socket after login');
    notificationService.connect();
    
    navigate('/');
  };

  return (
    <LoginScreen onLoginSuccess={handleLoginSuccess} />
  );
}; 