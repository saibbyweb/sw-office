import React, { useEffect, useState } from 'react';
import styled from 'styled-components';

interface BreakTimerProps {
  startTime: number;
  isRunning: boolean;
}

const TimerContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
  margin-top: ${props => props.theme.spacing.md};
`;

const TimerDisplay = styled.div`
  font-size: 2.5rem;
  font-weight: bold;
  color: ${props => props.theme.colors.warning};
`;

const TimerLabel = styled.div`
  font-size: 0.875rem;
  color: ${props => props.theme.colors.text}80;
`;

export const BreakTimer: React.FC<BreakTimerProps> = ({ startTime, isRunning }) => {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!isRunning) {
      return;
    }

    const interval = setInterval(() => {
      const now = Date.now();
      setElapsed(now - startTime);
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime, isRunning]);

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    const displayHours = hours.toString().padStart(2, '0');
    const displayMinutes = (minutes % 60).toString().padStart(2, '0');
    const displaySeconds = (seconds % 60).toString().padStart(2, '0');

    return `${displayHours}:${displayMinutes}:${displaySeconds}`;
  };

  return (
    <TimerContainer>
      <TimerLabel>Break Duration</TimerLabel>
      <TimerDisplay>{formatTime(elapsed)}</TimerDisplay>
    </TimerContainer>
  );
}; 