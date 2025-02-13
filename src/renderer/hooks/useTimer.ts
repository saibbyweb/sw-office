import { useState, useEffect, useCallback } from 'react';

interface TimerOptions {
  startTime?: number;
  interval?: number;
  onTick?: (elapsed: number) => void;
  autoStart?: boolean;
}

export const useTimer = ({
  startTime = Date.now(),
  interval = 1000,
  onTick,
  autoStart = false
}: TimerOptions = {}) => {
  const [isRunning, setIsRunning] = useState(autoStart);
  const [elapsed, setElapsed] = useState(0);

  const start = useCallback(() => {
    setIsRunning(true);
  }, []);

  const stop = useCallback(() => {
    setIsRunning(false);
  }, []);

  const reset = useCallback(() => {
    setElapsed(0);
    setIsRunning(false);
  }, []);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    if (isRunning) {
      intervalId = setInterval(() => {
        const newElapsed = Date.now() - startTime;
        setElapsed(newElapsed);
        onTick?.(newElapsed);
      }, interval);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isRunning, startTime, interval, onTick]);

  const formatTime = useCallback((ms: number) => {
    const seconds = Math.floor((ms / 1000) % 60);
    const minutes = Math.floor((ms / (1000 * 60)) % 60);
    const hours = Math.floor(ms / (1000 * 60 * 60));

    return {
      hours,
      minutes,
      seconds,
      formatted: `${hours.toString().padStart(2, '0')}:${minutes
        .toString()
        .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
    };
  }, []);

  return {
    isRunning,
    elapsed,
    formattedTime: formatTime(elapsed),
    start,
    stop,
    reset
  };
}; 