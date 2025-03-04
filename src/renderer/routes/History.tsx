import React from 'react';
import { useNavigate } from 'react-router-dom';
import { PastSessionsScreen } from '../components/screens/PastSessionsScreen';

export const History: React.FC = () => {
  const navigate = useNavigate();

  return (
    <PastSessionsScreen onBack={() => navigate('/')} />
  );
}; 