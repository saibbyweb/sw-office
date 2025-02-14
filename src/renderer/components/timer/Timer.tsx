import React, { useEffect, useState } from 'react';
import styled from 'styled-components';

interface TimerProps {
  startTime?: number;
  isRunning: boolean;
}

const TimerContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: ${props => props.theme.spacing.md};
`;

const TimerDisplay = styled.div`
  font-size: 2.5rem;
  font-weight: bold;
  color: ${props => props.theme.colors.primary};
`;

const formatTime = (ms: number) => {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  const displayHours = hours.toString().padStart(2, '0');
  const displayMinutes = (minutes % 60).toString().padStart(2, '0');
  const displaySeconds = (seconds % 60).toString().padStart(2, '0');

  return `${displayHours}:${displayMinutes}:${displaySeconds}`;
};

export const Timer: React.FC<TimerProps> = ({ 
  startTime = Date.now(), 
  isRunning
}) => {
  const [elapsed, setElapsed] = useState(() => {
    if (!startTime || !isRunning) return 0;
    return Date.now() - startTime;
  });

  useEffect(() => {
    if (!isRunning) {
      setElapsed(0);
      return;
    }

    // Set initial elapsed time
    setElapsed(Date.now() - startTime);

    const interval = setInterval(() => {
      setElapsed(Date.now() - startTime);
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime, isRunning]);

  return (
    <TimerContainer>
      <TimerDisplay>
        {formatTime(elapsed)}
      </TimerDisplay>
    </TimerContainer>
  );
}; 