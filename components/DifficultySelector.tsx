import React, { useState } from 'react';
import { Difficulty, ChatMode } from '../types';
import { TextIcon, MicrophoneIcon } from './icons';

interface DifficultySelectorProps {
  onProceedToTimerSetup: (difficulty: Difficulty, mode: ChatMode) => void;
}

const DifficultySelector: React.FC<DifficultySelectorProps> = ({ onProceedToTimerSetup }) => {
  const [selectedMode, setSelectedMode] = useState<ChatMode>(ChatMode.TEXT);

  const handleSelect = (difficulty: Difficulty) => {
    onProceedToTimerSetup(difficulty, selectedMode);
  };

  const modeOptions = {
      [ChatMode.TEXT]: { icon: TextIcon },
      [ChatMode.VOICE]: { icon: MicrophoneIcon },
  }

  const difficultyOptions = [
    {
      level: Difficulty.EASY,
      description: "Focuses on foundational concepts and straightforward problems, ideal for warming up.",
    },
    {
      level: Difficulty.MEDIUM,
      description: "A standard interview challenge with ambiguity, requiring depth and trade-off analysis.",
    },
    {
      level: Difficulty.HARD,
      description: "A complex, multi-layered problem with significant constraints for seasoned candidates.",
    },
  ];

  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center">
      <h2 className="text-2xl font-semibold mb-2 text-brand-text">Welcome, Candidate!</h2>
      <p className="text-brand-text-muted mb-6">First, choose your interview mode.</p>
      
      <div className="flex space-x-2 p-1 bg-brand-surface rounded-lg mb-8">
        {(Object.values(ChatMode) as ChatMode[]).map((mode) => {
            const Icon = modeOptions[mode].icon;
            return (
              <button
                key={mode}
                onClick={() => setSelectedMode(mode)}
                className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors flex items-center gap-2 ${
                  selectedMode === mode
                    ? 'bg-brand-primary text-white'
                    : 'text-brand-text-muted hover:bg-brand-secondary'
                }`}
              >
                <Icon className="h-5 w-5" />
                {mode} Mode
              </button>
            )
        })}
      </div>
      
      <p className="text-brand-text-muted mb-8">Now, please select a difficulty level to begin.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
        {difficultyOptions.map(({ level, description }) => (
          <button
            key={level}
            onClick={() => handleSelect(level)}
            className="p-6 text-left bg-brand-surface rounded-lg border border-brand-secondary hover:border-brand-primary hover:bg-brand-secondary/30 focus:outline-none focus:ring-2 focus:ring-brand-primary transition-all duration-200 flex flex-col"
          >
            <h3 className="text-xl font-bold text-brand-text mb-2">{level}</h3>
            <p className="text-sm text-brand-text-muted flex-grow">{description}</p>
          </button>
        ))}
      </div>
    </div>
  );
};

export default DifficultySelector;