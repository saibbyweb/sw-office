import React from 'react';
import { Navigate } from 'react-router-dom';

interface PrivateRouteProps {
  children: React.ReactNode;
}

export const PrivateRoute: React.FC<PrivateRouteProps> = ({ children }) => {
  const authToken = localStorage.getItem('authToken');

  if (!authToken) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}; 