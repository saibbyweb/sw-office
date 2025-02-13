import React, { useEffect } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { NotificationProps } from '../../types';

const NotificationContainer = styled(motion.div)<{ type: NotificationProps['type'] }>`
  position: fixed;
  bottom: ${props => props.theme.spacing.lg};
  right: ${props => props.theme.spacing.lg};
  padding: ${props => props.theme.spacing.md};
  border-radius: 8px;
  background-color: ${props => {
    switch (props.type) {
      case 'success': return props.theme.colors.success;
      case 'error': return props.theme.colors.error;
      case 'warning': return props.theme.colors.warning;
      default: return props.theme.colors.primary;
    }
  }};
  color: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
  z-index: 1100;
  max-width: 400px;
`;

const Icon = styled.span`
  font-size: 1.25rem;
`;

const Message = styled.p`
  margin: 0;
  font-size: 0.875rem;
  line-height: 1.4;
`;

const getIcon = (type: NotificationProps['type']) => {
  switch (type) {
    case 'success': return '✓';
    case 'error': return '✕';
    case 'warning': return '⚠';
    default: return 'ℹ';
  }
};

export const Notification: React.FC<NotificationProps> = ({
  type = 'info',
  message,
  duration = 3000
}) => {
  const [isVisible, setIsVisible] = React.useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration]);

  return (
    <AnimatePresence>
      {isVisible && (
        <NotificationContainer
          type={type}
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
        >
          <Icon>{getIcon(type)}</Icon>
          <Message>{message}</Message>
        </NotificationContainer>
      )}
    </AnimatePresence>
  );
}; 