import React, { useState, useEffect, useRef } from 'react';
import { ClockIcon } from './icons';

interface TimerProps {
  startTime: Date;
  isFinished: boolean;
  duration?: number; // Duration in seconds
  onTimeLow?: () => void;
  onTimerEnd?: () => void;
}

const formatTime = (totalSeconds: number): string => {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const paddedMinutes = String(minutes).padStart(2, '0');
  const paddedSeconds = String(seconds).padStart(2, '0');
  return `${paddedMinutes}:${paddedSeconds}`;
};

const Timer: React.FC<TimerProps> = ({ startTime, isFinished, duration, onTimeLow, onTimerEnd }) => {
  const [displayTime, setDisplayTime] = useState('00:00');
  const timeLowNotified = useRef(false);

  useEffect(() => {
    if (isFinished) {
      // When finished, calculate final time and stop
      const finalElapsed = Math.floor((new Date().getTime() - startTime.getTime()) / 1000);
      if (duration) {
        const finalRemaining = Math.max(0, duration - finalElapsed);
        setDisplayTime(formatTime(finalRemaining));
      } else {
        setDisplayTime(formatTime(finalElapsed));
      }
      return;
    }

    const intervalId = setInterval(() => {
      const elapsedSeconds = Math.floor((new Date().getTime() - startTime.getTime()) / 1000);

      if (duration) {
        // Countdown mode
        const remainingSeconds = duration - elapsedSeconds;
        if (remainingSeconds <= 60 && !timeLowNotified.current && onTimeLow) {
          onTimeLow();
          timeLowNotified.current = true;
        }

        if (remainingSeconds <= 0) {
          setDisplayTime('00:00');
          if (onTimerEnd) onTimerEnd();
          clearInterval(intervalId);
        } else {
          setDisplayTime(formatTime(remainingSeconds));
        }
      } else {
        // Stopwatch mode
        setDisplayTime(formatTime(elapsedSeconds));
      }
    }, 1000);

    return () => clearInterval(intervalId);
  }, [startTime, isFinished, duration, onTimeLow, onTimerEnd]);
  
  // When duration changes (e.g., time added), reset the notification ref
  useEffect(() => {
    timeLowNotified.current = false;
  }, [duration]);

  return (
    <div className={`flex items-center space-x-2 font-mono ${displayTime.startsWith('00:') ? 'text-red-400' : 'text-brand-text-muted'}`}>
      <ClockIcon className="h-5 w-5" />
      <span className="text-sm">{displayTime}</span>
    </div>
  );
};

export default Timer;