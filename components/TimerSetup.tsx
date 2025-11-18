import React, { useState } from 'react';

interface TimerSetupProps {
  onStartSession: (durationInSeconds?: number) => void;
  onBack: () => void;
}

const TimerSetup: React.FC<TimerSetupProps> = ({ onStartSession, onBack }) => {
  const [customTime, setCustomTime] = useState('');

  const timeOptions = [
    { label: '15 min', duration: 15 * 60 },
    { label: '30 min', duration: 30 * 60 },
    { label: '45 min', duration: 45 * 60 },
  ];

  const handleCustomStart = () => {
    const minutes = parseInt(customTime, 10);
    if (!isNaN(minutes) && minutes > 0) {
      onStartSession(minutes * 60);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center">
      <h2 className="text-2xl font-semibold mb-2 text-brand-text">Set Interview Duration</h2>
      <p className="text-brand-text-muted mb-8">Choose a preset or enter a custom time.</p>
      
      <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 mb-6">
        {timeOptions.map((option) => (
          <button
            key={option.label}
            onClick={() => onStartSession(option.duration)}
            className="w-48 px-6 py-3 font-semibold text-white bg-brand-primary rounded-lg shadow-md hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-opacity-75 transition-transform transform hover:scale-105"
          >
            {option.label}
          </button>
        ))}
      </div>

      <div className="w-full max-w-xs border-t border-brand-secondary my-6"></div>

      <div className="flex items-center space-x-2 mb-6">
        <input
          type="number"
          value={customTime}
          onChange={(e) => setCustomTime(e.target.value)}
          placeholder="Custom (min)"
          className="w-32 bg-brand-surface border border-brand-secondary rounded-lg px-4 py-3 text-center focus:outline-none focus:ring-2 focus:ring-brand-primary"
          min="1"
        />
        <button
          onClick={handleCustomStart}
          disabled={!customTime || parseInt(customTime, 10) <= 0}
          className="px-6 py-3 font-semibold text-white bg-green-600 rounded-lg shadow-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-75 disabled:bg-brand-secondary disabled:cursor-not-allowed transition-colors"
        >
          Start
        </button>
      </div>
      
      <div className="flex flex-col space-y-4">
        <button
          onClick={() => onStartSession(undefined)}
          className="w-48 px-6 py-3 font-semibold text-brand-text-muted bg-brand-surface rounded-lg hover:bg-brand-secondary focus:outline-none focus:ring-2 focus:ring-brand-secondary"
        >
          No Timer
        </button>
        <button
            onClick={onBack}
            className="text-sm text-brand-text-muted hover:text-brand-text transition-colors"
        >
            &larr; Go Back
        </button>
      </div>
    </div>
  );
};

export default TimerSetup;