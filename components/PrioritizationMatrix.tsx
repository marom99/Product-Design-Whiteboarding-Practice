import React, { useState } from 'react';
import { PrioritizationItem } from '../types';
import { PlusIcon, TrashIcon } from './icons';

interface PrioritizationMatrixProps {
  items: PrioritizationItem[];
  onItemsChange: (newItems: PrioritizationItem[]) => void;
}

const PrioritizationMatrix: React.FC<PrioritizationMatrixProps> = ({ items, onItemsChange }) => {
  const [newItemText, setNewItemText] = useState('');
  const [newItemImpact, setNewItemImpact] = useState('Medium');
  const [newItemEffort, setNewItemEffort] = useState('Medium');

  const impactValueMap: { [key: string]: number } = { High: 85, Medium: 50, Low: 15 };
  const effortValueMap: { [key: string]: number } = { High: 85, Medium: 50, Low: 15 };
  
  const effortOptions = ['Low', 'Medium', 'High']; 
  const impactOptions = ['High', 'Medium', 'Low'];

  const handleAddItem = () => {
    if (newItemText.trim()) {
      const newItem: PrioritizationItem = {
        id: Date.now().toString(),
        text: newItemText.trim(),
        effort: effortValueMap[newItemEffort],
        impact: impactValueMap[newItemImpact],
      };
      onItemsChange([...items, newItem]);
      setNewItemText('');
      setNewItemImpact('Medium');
      setNewItemEffort('Medium');
    }
  };

  const handleRemoveItem = (id: string) => {
    onItemsChange(items.filter(item => item.id !== id));
  };
  
  const getBackgroundColor = (impact: number, effort: number) => {
      if (impact > 50 && effort <= 50) return 'bg-green-500'; // Quick Wins
      if (impact > 50 && effort > 50) return 'bg-blue-500';  // Major Projects
      if (impact <= 50 && effort > 50) return 'bg-red-500';   // Reconsider
      return 'bg-yellow-500'; // Fill-ins (impact <= 50 && effort <= 50)
  };
  
  const getValueLabel = (value: number): string => {
    if (value === 85) return 'High';
    if (value === 50) return 'Medium';
    return 'Low';
  };

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Input Form */}
      <div className="flex flex-col sm:flex-row items-end gap-2 p-2 bg-brand-bg/50 border border-brand-secondary rounded-md">
        <div className="flex-1 w-full">
            <label htmlFor="idea-input" className="block text-xs font-medium text-brand-text-muted mb-1">New Idea</label>
            <input
              id="idea-input"
              type="text"
              value={newItemText}
              onChange={(e) => setNewItemText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddItem()}
              placeholder="e.g., Add social login"
              className="w-full bg-brand-bg border border-brand-secondary rounded-md p-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand-primary"
            />
        </div>
        <div className="w-full sm:w-32">
            <label htmlFor="impact-select" className="block text-xs font-medium text-brand-text-muted mb-1">Impact</label>
            <select
                id="impact-select"
                value={newItemImpact}
                onChange={(e) => setNewItemImpact(e.target.value)}
                className="w-full bg-brand-bg border border-brand-secondary rounded-md p-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand-primary h-10"
            >
                {impactOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
        </div>
        <div className="w-full sm:w-32">
            <label htmlFor="effort-select" className="block text-xs font-medium text-brand-text-muted mb-1">Effort</label>
             <select
                id="effort-select"
                value={newItemEffort}
                onChange={(e) => setNewItemEffort(e.target.value)}
                className="w-full bg-brand-bg border border-brand-secondary rounded-md p-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand-primary h-10"
            >
                {effortOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
        </div>
        <button
          onClick={handleAddItem}
          disabled={!newItemText.trim()}
          className="p-2 bg-brand-primary text-white rounded-md hover:bg-indigo-500 disabled:opacity-50 flex items-center justify-center sm:self-end h-10 w-full sm:w-10 flex-shrink-0"
          aria-label="Add Idea"
        >
          <PlusIcon className="h-5 w-5" />
        </button>
      </div>
      
      {/* List and Matrix */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 min-h-[300px]">
        {/* List of ideas */}
        <div className="flex flex-col bg-brand-bg/50 border border-brand-secondary rounded-md p-3">
            <h4 className="font-semibold text-sm mb-2 text-brand-text">Prioritized Ideas</h4>
            <div className="flex-1 overflow-y-auto pr-2 -mr-2">
                 {items.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-sm text-brand-text-muted">
                        Add ideas using the form above.
                    </div>
                ) : (
                    <ul className="space-y-2">
                        {items.map((item, index) => (
                            <li 
                                key={item.id} 
                                className="flex items-center justify-between gap-2 p-2 rounded bg-brand-secondary/50"
                                title={`${item.text} (Impact: ${getValueLabel(item.impact)}, Effort: ${getValueLabel(item.effort)})`}
                            >
                                <div className="flex items-start gap-3 flex-1 overflow-hidden">
                                    <span className={`w-6 h-6 mt-1 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs font-bold ${getBackgroundColor(item.impact, item.effort)}`}>
                                        {index + 1}
                                    </span>
                                    <div className="flex-1 overflow-hidden">
                                        <p className="truncate text-sm text-brand-text" title={item.text}>{item.text}</p>
                                        <p className="text-xs text-brand-text-muted">
                                            Impact: {getValueLabel(item.impact)} &bull; Effort: {getValueLabel(item.effort)}
                                        </p>
                                    </div>
                                </div>
                                <button onClick={() => handleRemoveItem(item.id)} className="text-red-500/70 hover:text-red-500 p-1" aria-label={`Remove ${item.text}`}>
                                    <TrashIcon className="h-4 w-4" />
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>

        {/* Matrix Visualization */}
        <div className="relative border border-brand-secondary rounded-md bg-brand-bg/30 p-4 flex flex-col justify-between">
            {/* Axis and quadrant lines */}
            <div className="absolute top-1/2 left-2 right-2 h-px bg-brand-secondary/50 border-t border-dashed"></div>
            <div className="absolute left-1/2 top-2 bottom-2 w-px bg-brand-secondary/50 border-l border-dashed"></div>
            
            {/* Quadrant Labels */}
            <div className="absolute top-2 left-2 text-xs text-green-400 font-semibold">Quick Wins</div>
            <div className="absolute top-2 right-2 text-xs text-blue-400 font-semibold">Major Projects</div>
            <div className="absolute bottom-2 left-2 text-xs text-yellow-400 font-semibold">Fill-ins</div>
            <div className="absolute bottom-2 right-2 text-xs text-red-400 font-semibold">Reconsider</div>
            
            {/* Axis Labels */}
            <span className="absolute top-1/2 -left-1 text-xs text-brand-text-muted transform -translate-y-1/2 -rotate-90 origin-center">Impact</span>
            <span className="absolute bottom-0 left-1/2 text-xs text-brand-text-muted transform -translate-x-1/2 translate-y-4">Effort</span>

            {/* Plotted Items */}
            <div className="absolute inset-2">
                {items.map((item, index) => (
                    <div
                        key={item.id}
                        className={`absolute w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg transform -translate-x-1/2 -translate-y-1/2 ${getBackgroundColor(item.impact, item.effort)}`}
                        style={{
                            left: `${item.effort}%`,
                            top: `${100 - item.impact}%`,
                        }}
                        title={`${item.text} (Impact: ${getValueLabel(item.impact)}, Effort: ${getValueLabel(item.effort)})`}
                    >
                        {index + 1}
                    </div>
                ))}
            </div>
        </div>
      </div>
    </div>
  );
};

export default PrioritizationMatrix;