import React, { useState } from 'react';
import { HourglassIcon, PlusIcon } from './icons';

interface TimeLowModalProps {
  onAddTime: (minutes: number) => void;
  onFinish: () => void;
  onDismiss: () => void;
}

const TimeLowModal: React.FC<TimeLowModalProps> = ({ onAddTime, onFinish, onDismiss }) => {
  const [minutesToAdd, setMinutesToAdd] = useState('5');

  const handleAddTimeClick = () => {
    const minutes = parseInt(minutesToAdd, 10);
    if (!isNaN(minutes) && minutes > 0) {
      onAddTime(minutes);
    }
  };

  return (
    <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center z-20">
      <div className="bg-brand-surface p-8 rounded-lg shadow-2xl text-center max-w-sm border border-brand-secondary">
        <HourglassIcon className="h-12 w-12 text-amber-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-brand-text mb-2">Time is running low!</h2>
        <p className="text-brand-text-muted mb-6">You have less than a minute remaining. Add more time or finish the session.</p>
        <div className="flex flex-col space-y-4">
          <div className="flex items-stretch gap-2">
            <input
              type="number"
              value={minutesToAdd}
              onChange={(e) => setMinutesToAdd(e.target.value)}
              className="w-24 bg-brand-bg border border-brand-secondary rounded-lg px-3 py-2 text-center focus:outline-none focus:ring-2 focus:ring-brand-primary"
              min="1"
              placeholder="Mins"
              aria-label="Minutes to add"
            />
            <button
              onClick={handleAddTimeClick}
              disabled={!minutesToAdd || parseInt(minutesToAdd, 10) <= 0}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 font-semibold text-white bg-brand-primary rounded-lg shadow-md hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-opacity-75 transition-colors disabled:bg-brand-secondary disabled:cursor-not-allowed"
            >
              <PlusIcon className="h-5 w-5" />
              Add Time
            </button>
          </div>
          <button
            onClick={onFinish}
            className="w-full px-6 py-3 font-semibold text-brand-text bg-brand-secondary rounded-lg hover:bg-zinc-600 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-opacity-75 transition-colors"
          >
            Finish Session
          </button>
          <button
            onClick={onDismiss}
            className="w-full px-6 py-2 text-sm font-semibold text-brand-text-muted hover:text-brand-text transition-colors"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
};

export default TimeLowModal;
