import React, { useState, useEffect, useRef } from 'react';
import { Session, CanvasState } from '../types';
import Timer from './Timer';
import PrioritizationMatrix from './PrioritizationMatrix';
import { LoadingSpinner, PaperClipIcon, TrashIcon, ClockIcon } from './icons';
import { fileToDataUrl } from '../utils/image';

const formatSectionTime = (totalSeconds: number): string => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

interface CanvasSectionProps {
  number: number;
  title: string;
  subtitle: string;
  children: React.ReactNode;
  className?: string;
  timeSpent?: number;
  isActive?: boolean;
}

export const CanvasSection: React.FC<CanvasSectionProps> = ({ number, title, subtitle, children, className = '', timeSpent, isActive }) => (
  <div className={`p-4 bg-brand-surface border border-brand-secondary rounded-lg flex flex-col transition-all duration-200 ${isActive ? 'ring-2 ring-brand-primary border-transparent' : ''} ${className}`}>
    <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
            <div className="w-8 h-8 flex-shrink-0 flex items-center justify-center border-2 border-brand-text-muted rounded-full text-brand-text-muted font-bold">
                {number}
            </div>
            <div>
                <h3 className="font-bold text-lg text-brand-text">{title}</h3>
                <p className="text-sm text-brand-text-muted">{subtitle}</p>
            </div>
        </div>
         {timeSpent !== undefined && (
            <div className="flex items-center gap-1.5 text-xs font-mono text-brand-text-muted px-2 py-1 bg-brand-bg rounded-md">
                <ClockIcon className="h-4 w-4" />
                <span>{formatSectionTime(timeSpent)}</span>
            </div>
        )}
    </div>
    <div className="flex-1 flex flex-col">
      {children}
    </div>
  </div>
);

interface CanvasViewProps {
    session: Session;
    onStateChange: (newState: CanvasState) => void;
    onSubmit: () => void;
    isLoading: boolean;
    onFinish: () => void;
    onTimeLow: () => void;
    onTimerEnd: () => void;
}

const CanvasTextArea: React.FC<{ value: string, onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void, placeholder?: string }> = ({ value, onChange, placeholder="Start typing..." }) => (
    <textarea
        value={value}
        onChange={onChange}
        className="w-full flex-1 bg-brand-bg/50 border border-brand-secondary rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-brand-primary resize-none text-sm"
        placeholder={placeholder}
    />
);

const CanvasView: React.FC<CanvasViewProps> = ({ session, onStateChange, onSubmit, isLoading, onFinish, onTimeLow, onTimerEnd }) => {
    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const [activeSection, setActiveSection] = useState<keyof CanvasState['sectionTimers'] | null>(null);

    const sessionRef = useRef(session);
    useEffect(() => {
        sessionRef.current = session;
    }, [session]);

    useEffect(() => {
        if (!activeSection) {
            return;
        }

        const intervalId = setInterval(() => {
            const currentCanvasState = sessionRef.current.canvasState;
            if (currentCanvasState) {
                const newTimers = { ...currentCanvasState.sectionTimers };
                newTimers[activeSection] = (newTimers[activeSection] || 0) + 1;
                
                onStateChange({
                    ...currentCanvasState,
                    sectionTimers: newTimers,
                });
            }
        }, 1000);

        return () => clearInterval(intervalId);
    }, [activeSection, onStateChange]);
    
    if (!session.canvasState) return null;

    const handleSectionFocus = (section: keyof CanvasState['sectionTimers']) => {
        setActiveSection(section);
    };

    const handleSectionChange = (section: keyof Omit<CanvasState['sections'], 'solveImageUrl'>, value: string) => {
        onStateChange({
            ...session.canvasState!,
            sections: {
                ...session.canvasState!.sections,
                [section]: value,
            },
        });
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && session.canvasState) {
            try {
                const dataUrl = await fileToDataUrl(file);
                onStateChange({
                    ...session.canvasState,
                    sections: {
                        ...session.canvasState.sections,
                        solveImageUrl: dataUrl,
                    }
                });
            } catch (error) {
                console.error("Error converting file:", error);
            }
        }
    };

    const handleRemoveImage = () => {
        if (session.canvasState) {
            const { solveImageUrl, ...restSections } = session.canvasState.sections;
            onStateChange({
                ...session.canvasState,
                sections: restSections,
            });
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };
    
    return (
        <div className="flex flex-col h-full overflow-hidden">
             <div className="flex justify-between items-center px-4 pt-4 pb-2 max-w-7xl mx-auto w-full">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onSubmit}
                        disabled={isLoading}
                        className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-green-700 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-wait flex items-center gap-2"
                    >
                        {isLoading ? <LoadingSpinner className="h-4 w-4" /> : null}
                        Submit for Review
                    </button>
                    <button
                        onClick={onFinish}
                        disabled={isLoading}
                        className="px-4 py-2 text-sm font-medium text-white bg-amber-600 border border-amber-700 rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50"
                    >
                        Finish Session
                    </button>
                </div>
                {session.startTime && (
                    <Timer 
                        startTime={new Date(session.startTime)} 
                        duration={session.duration}
                        isFinished={session.isFinished}
                        onTimeLow={onTimeLow}
                        onTimerEnd={onTimerEnd}
                    />
                )}
            </div>
            <div className="flex-1 overflow-y-auto p-4 max-w-7xl w-full mx-auto">
                <div className="p-4 bg-brand-surface border border-brand-secondary rounded-lg mb-4">
                    <h2 className="text-sm font-semibold text-brand-text-muted mb-1">TASK</h2>
                    <p className="text-brand-text">{session.canvasState.task}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start mb-4">
                    <div onClick={() => handleSectionFocus('why')} className="cursor-pointer">
                        <CanvasSection number={1} title="Why?" subtitle="Understand your goal." className="min-h-[250px]" timeSpent={session.canvasState.sectionTimers.why} isActive={activeSection === 'why'}>
                            <CanvasTextArea value={session.canvasState.sections.why} onChange={(e) => handleSectionChange('why', e.target.value)} />
                        </CanvasSection>
                    </div>
                     <div onClick={() => handleSectionFocus('who')} className="cursor-pointer">
                        <CanvasSection number={2} title="Who?" subtitle="Define the audience." className="min-h-[250px]" timeSpent={session.canvasState.sectionTimers.who} isActive={activeSection === 'who'}>
                            <CanvasTextArea value={session.canvasState.sections.who} onChange={(e) => handleSectionChange('who', e.target.value)} />
                        </CanvasSection>
                    </div>
                     <div onClick={() => handleSectionFocus('whenAndWhere')} className="cursor-pointer">
                        <CanvasSection number={3} title="When & Where?" subtitle="Customer's context & needs." className="min-h-[250px]" timeSpent={session.canvasState.sectionTimers.whenAndWhere} isActive={activeSection === 'whenAndWhere'}>
                             <CanvasTextArea value={session.canvasState.sections.whenAndWhere} onChange={(e) => handleSectionChange('whenAndWhere', e.target.value)} />
                        </CanvasSection>
                    </div>
                     <div onClick={() => handleSectionFocus('what')} className="cursor-pointer">
                        <CanvasSection number={4} title="What?" subtitle="List ideas (A, B, C...)" className="min-h-[250px]" timeSpent={session.canvasState.sectionTimers.what} isActive={activeSection === 'what'}>
                            <CanvasTextArea value={session.canvasState.sections.what} onChange={(e) => handleSectionChange('what', e.target.value)} />
                        </CanvasSection>
                    </div>
                </div>

                <div className="space-y-4">
                    <div onClick={() => handleSectionFocus('prioritize')} className="cursor-pointer">
                         <CanvasSection number={5} title="Prioritize" subtitle="Choose an idea." className="min-h-[500px]" timeSpent={session.canvasState.sectionTimers.prioritize} isActive={activeSection === 'prioritize'}>
                            <PrioritizationMatrix
                                items={session.canvasState.prioritizationItems}
                                onItemsChange={(newItems) => onStateChange({ ...session.canvasState!, prioritizationItems: newItems })}
                            />
                        </CanvasSection>
                    </div>
                    <div onClick={() => handleSectionFocus('solve')} className="cursor-pointer">
                        <CanvasSection number={6} title="Solve" subtitle="Detail your solution. You can add one image." className="min-h-[400px]" timeSpent={session.canvasState.sectionTimers.solve} isActive={activeSection === 'solve'}>
                            <div className="flex-1 flex flex-col gap-2">
                                 <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleImageUpload}
                                    accept="image/png, image/jpeg, image/webp"
                                    className="hidden"
                                />
                                <CanvasTextArea 
                                    value={session.canvasState.sections.solve} 
                                    onChange={(e) => handleSectionChange('solve', e.target.value)} 
                                    placeholder="Detail your solution here. You can add a sketch or wireframe below."
                                />
                                <div className="flex items-center gap-4 py-1">
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="flex items-center gap-2 text-sm text-brand-text-muted hover:text-brand-text focus:outline-none"
                                        aria-label="Attach solution sketch"
                                    >
                                        <PaperClipIcon className="h-5 w-5" />
                                        <span>Add Sketch</span>
                                    </button>
                                    {session.canvasState.sections.solveImageUrl && (
                                        <div className="relative w-20 h-20 p-1 border border-brand-secondary rounded-lg">
                                            <img src={session.canvasState.sections.solveImageUrl} alt="Solution preview" className="w-full h-full object-cover rounded-md" />
                                            <button 
                                                onClick={handleRemoveImage}
                                                className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1"
                                                aria-label="Remove image"
                                            >
                                                <TrashIcon className="w-4 h-4" />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </CanvasSection>
                    </div>
                    <div onClick={() => handleSectionFocus('how')} className="cursor-pointer">
                         <CanvasSection number={7} title="How?" subtitle="Measure success." className="min-h-[250px]" timeSpent={session.canvasState.sectionTimers.how} isActive={activeSection === 'how'}>
                             <CanvasTextArea value={session.canvasState.sections.how} onChange={(e) => handleSectionChange('how', e.target.value)} />
                        </CanvasSection>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CanvasView;