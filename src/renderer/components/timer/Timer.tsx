import React from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { useTimer } from '../../hooks/useTimer';

interface TimerProps {
  startTime?: number;
  isRunning?: boolean;
  onTick?: (elapsed: number) => void;
  variant?: 'session' | 'break';
}

const TimerContainer = styled(motion.div)<{ variant: TimerProps['variant'] }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${props => props.theme.spacing.xs};
  padding: ${props => props.theme.spacing.md};
  border-radius: 12px;
  background-color: ${props =>
    props.variant === 'break'
      ? `${props.theme.colors.warning}15`
      : `${props.theme.colors.primary}15`};
`;

const TimerDisplay = styled.div`
  font-family: monospace;
  font-size: 2.5rem;
  font-weight: bold;
  color: ${props => props.theme.colors.text};
  letter-spacing: 2px;
`;

const Label = styled.span<{ variant: TimerProps['variant'] }>`
  font-size: 0.875rem;
  color: ${props =>
    props.variant === 'break'
      ? props.theme.colors.warning
      : props.theme.colors.primary};
  font-weight: 500;
`;

export const Timer: React.FC<TimerProps> = ({
  startTime,
  isRunning = false,
  onTick,
  variant = 'session'
}) => {
  const { formattedTime } = useTimer({
    startTime,
    autoStart: isRunning,
    onTick
  });

  return (
    <TimerContainer
      variant={variant}
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.2 }}
    >
      <Label variant={variant}>
        {variant === 'break' ? 'Break Duration' : 'Session Duration'}
      </Label>
      <TimerDisplay>{formattedTime.formatted}</TimerDisplay>
    </TimerContainer>
  );
}; 