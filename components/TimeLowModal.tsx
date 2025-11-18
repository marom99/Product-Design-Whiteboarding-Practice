import React from 'react';
import { HourglassIcon, PlusIcon } from './icons';

interface TimeLowModalProps {
  onAddTime: () => void;
  onFinish: () => void;
}

const TimeLowModal: React.FC<TimeLowModalProps> = ({ onAddTime, onFinish }) => {
  return (
    <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center z-20">
      <div className="bg-brand-surface p-8 rounded-lg shadow-2xl text-center max-w-sm border border-brand-secondary">
        <HourglassIcon className="h-12 w-12 text-amber-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-brand-text mb-2">Time is running low!</h2>
        <p className="text-brand-text-muted mb-6">You have less than a minute remaining. What would you like to do?</p>
        <div className="flex flex-col space-y-4">
          <button
            onClick={onAddTime}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 font-semibold text-white bg-brand-primary rounded-lg shadow-md hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-opacity-75 transition-colors"
          >
            <PlusIcon className="h-5 w-5" />
            Add 5 Minutes
          </button>
          <button
            onClick={onFinish}
            className="w-full px-6 py-3 font-semibold text-brand-text bg-brand-secondary rounded-lg hover:bg-zinc-600 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-opacity-75 transition-colors"
          >
            Finish Session
          </button>
        </div>
      </div>
    </div>
  );
};

export default TimeLowModal;
