import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Chat, Part, Content } from "@google/genai";
import { ChatMessage, Difficulty, Role, Session, ChatMode, CanvasState } from './types';
import { createChatSession, generateCheatSheet } from './services/geminiService';
import { dataUrlToGeminiPart } from './utils/image';
import { SYSTEM_INSTRUCTION, SYSTEM_INSTRUCTION_CANVAS_REVIEW } from './constants';
import Header from './components/Header';
import DifficultySelector from './components/DifficultySelector';
import ChatWindow from './components/ChatWindow';
import InputBar from './components/InputBar';
import Timer from './components/Timer';
import SessionHistory from './components/SessionHistory';
import VoiceInterface from './components/VoiceInterface';
import CanvasView from './components/CanvasView';
import { ChevronRightIcon, LoadingSpinner, EnterFullScreenIcon, ExitFullScreenIcon } from './components/icons';
import TimerSetup from './components/TimerSetup';
import TimeLowModal from './components/TimeLowModal';
import CheatSheetView from './components/CheatSheetView';

const LOCAL_STORAGE_KEY = 'product-design-interview-sessions';

function serializeCanvasState(canvasState: CanvasState): string {
    let markdown = `The user has submitted their design canvas for the task: "${canvasState.task}". Please begin the review.\n\n`;

    markdown += `## 1. Why? (Understand your goal)\n${canvasState.sections.why || 'Not filled'}\n\n`;
    markdown += `## 2. Who? (Define the audience)\n${canvasState.sections.who || 'Not filled'}\n\n`;
    markdown += `## 3. When & Where? (Understand customer's context and needs)\n${canvasState.sections.whenAndWhere || 'Not filled'}\n\n`;
    markdown += `## 4. What? (List ideas)\n${canvasState.sections.what || 'Not filled'}\n\n`;
    
    markdown += `## 5. Prioritize, choose idea\n`;
    if (canvasState.prioritizationItems.length > 0) {
        canvasState.prioritizationItems.forEach(item => {
            markdown += `- **${item.text}**: Impact=${item.impact.toFixed(0)}, Effort=${item.effort.toFixed(0)}\n`;
        });
    } else {
        markdown += `No ideas prioritized.\n`;
    }
    markdown += `\n`;

    markdown += `## 6. Solve\n${canvasState.sections.solve || 'Not filled'}\n`;
    if (canvasState.sections.solveImageUrl) {
        markdown += `[An image was provided for the solution.]\n\n`;
    } else {
        markdown += `\n`;
    }

    markdown += `## 7. How? (Measure success)\n${canvasState.sections.how || 'Not filled'}\n\n`;

    return markdown;
}


const App: React.FC = () => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSessionStarting, setIsSessionStarting] = useState<boolean>(false);
  const [chatSession, setChatSession] = useState<Chat | null>(null);
  const [isSidebarVisible, setIsSidebarVisible] = useState<boolean>(true);
  const [setupStep, setSetupStep] = useState<'difficulty' | 'timer' | 'active'>('difficulty');
  const [pendingSessionConfig, setPendingSessionConfig] = useState<{difficulty: Difficulty, mode: ChatMode} | null>(null);
  const [isTimeLowModalOpen, setIsTimeLowModalOpen] = useState<boolean>(false);
  const [textModeTab, setTextModeTab] = useState<'chat' | 'canvas' | 'cheatsheet'>('chat');
  const [isAwaitingReviewResponse, setIsAwaitingReviewResponse] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false);


  const activeSession = useMemo(() => {
    return sessions.find(s => s.id === activeSessionId) || null;
  }, [sessions, activeSessionId]);

  // Load sessions from localStorage on initial render
  useEffect(() => {
    try {
      const savedSessionsJSON = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (savedSessionsJSON) {
        const savedSessions = JSON.parse(savedSessionsJSON);
        if (Array.isArray(savedSessions)) {
          setSessions(savedSessions);
          if (savedSessions.length > 0 && !activeSessionId) {
              const lastActive = savedSessions[0];
              setActiveSessionId(lastActive.id);
              setSetupStep('active');
          } else if (savedSessions.length === 0) {
              setSetupStep('difficulty');
          }
        }
      }
    } catch (error) {
      console.error("Failed to load sessions from localStorage:", error);
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    }
  }, []);

  // Save sessions to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(sessions));
    } catch (error) {
      console.error("Failed to save sessions to localStorage:", error);
    }
  }, [sessions]);

  // Effect to re-create chat instance when active session changes, and handle review response
  useEffect(() => {
    if (activeSession) {
        const convertMessagesToHistory = (msgs: ChatMessage[]): Content[] => msgs.map(msg => {
            const parts: Part[] = [];
            if (msg.text) parts.push({ text: msg.text });
            if (msg.imageUrl) {
                try { parts.push(dataUrlToGeminiPart(msg.imageUrl)); } catch(e) { console.error(e); }
            }
            return { role: msg.role === Role.USER ? 'user' : 'model', parts: parts };
        });

        if (activeSession.mode === ChatMode.TEXT) {
            const systemInstruction = activeSession.isCanvasSubmitted ? SYSTEM_INSTRUCTION_CANVAS_REVIEW : SYSTEM_INSTRUCTION;
            const history = convertMessagesToHistory(activeSession.messages);
            const chat = createChatSession(history, systemInstruction);
            setChatSession(chat);

            if (isAwaitingReviewResponse) {
                setIsAwaitingReviewResponse(false);
                const lastMessage = activeSession.messages[activeSession.messages.length - 1];
                if (!lastMessage || lastMessage.role !== Role.USER) return;

                const messageParts: Part[] = [{ text: lastMessage.text }];
                if (lastMessage.imageUrl) {
                    try { messageParts.push(dataUrlToGeminiPart(lastMessage.imageUrl)); } 
                    catch(e) { console.error(e); }
                }

                chat.sendMessage({ message: messageParts }).then(response => {
                    const modelResponse: ChatMessage = { role: Role.MODEL, text: response.text };
                    updateSession(activeSession.id, { messages: [...activeSession.messages, modelResponse] });
                }).catch(error => {
                    console.error("Failed to get review response:", error);
                    const errorResponse: ChatMessage = { role: Role.MODEL, text: "Apologies, an error occurred while getting feedback." };
                    updateSession(activeSession.id, { messages: [...activeSession.messages, errorResponse] });
                }).finally(() => {
                    setIsLoading(false);
                });
            }
        } else {
            setChatSession(null);
        }
    } else {
      setChatSession(null);
    }
  }, [activeSession, isAwaitingReviewResponse]);

  const updateSession = (sessionId: string, updates: Partial<Session>) => {
    setSessions(prevSessions =>
      prevSessions.map(s => (s.id === sessionId ? { ...s, ...updates } : s))
    );
  };

  const startNewSession = useCallback(async (durationInSeconds?: number) => {
    if (!pendingSessionConfig) return;

    setIsSessionStarting(true);

    try {
      const { difficulty: selectedDifficulty, mode: selectedMode } = pendingSessionConfig;
      let newSession: Session;
      
      const chat = createChatSession();
      const promptResponse = await chat.sendMessage({ message: `Hello Alex. I'm ready to begin the interview. Please provide me with a ${selectedDifficulty} product design challenge.` });
      const promptText = promptResponse.text;

      if (selectedMode === ChatMode.VOICE) {
        newSession = {
            id: Date.now().toString(),
            title: `Voice Session - ${selectedDifficulty}`,
            difficulty: selectedDifficulty,
            mode: selectedMode,
            startTime: new Date().toISOString(),
            isFinished: false,
            messages: [{ role: Role.MODEL, text: promptText }],
            duration: durationInSeconds,
        };
      } else { // Text Mode (now includes Canvas)
        const firstMessage: ChatMessage = { role: Role.MODEL, text: promptText };
        newSession = {
          id: Date.now().toString(),
          title: promptText.substring(0, 40) + '...',
          difficulty: selectedDifficulty,
          mode: selectedMode,
          startTime: new Date().toISOString(),
          isFinished: false,
          messages: [firstMessage],
          duration: durationInSeconds,
          isCanvasSubmitted: false,
          canvasState: {
                task: promptText,
                sections: { why: '', who: '', whenAndWhere: '', what: '', solve: '', how: '' },
                sectionTimers: {
                    why: 0,
                    who: 0,
                    whenAndWhere: 0,
                    what: 0,
                    prioritize: 0,
                    solve: 0,
                    how: 0,
                },
                prioritizationItems: [],
          }
        };
      }
      
      setSessions(prev => [newSession, ...prev]);
      setActiveSessionId(newSession.id);
      setSetupStep('active');
      setPendingSessionConfig(null);
      setTextModeTab('chat');

    } catch (error)
 {
      console.error("Failed to start session:", error);
      // Potentially show an error message to the user
      setSetupStep('difficulty');
    } finally {
      setIsSessionStarting(false);
    }
  }, [pendingSessionConfig]);

  const handleSendMessage = useCallback(async (text: string, imageUrl?: string) => {
    if (!chatSession || !activeSessionId || !activeSession || activeSession.mode === ChatMode.VOICE) return;

    const newUserMessage: ChatMessage = { role: Role.USER, text, imageUrl };
    
    const updatedMessages = [...(activeSession?.messages || []), newUserMessage];
    updateSession(activeSessionId, { messages: updatedMessages });
    
    setIsLoading(true);

    try {
      const messageParts: (string | Part)[] = [];
      if (text) messageParts.push({ text });
      if (imageUrl) {
        try { messageParts.push(dataUrlToGeminiPart(imageUrl)); } 
        catch (e) { console.error("Failed to process image:", e); throw new Error("Invalid image format"); }
      }

      const response = await chatSession.sendMessage({ message: messageParts });
      const modelResponse: ChatMessage = { role: Role.MODEL, text: response.text };
      updateSession(activeSessionId, { messages: [...updatedMessages, modelResponse] });
    } catch (error) {
      console.error("Failed to send message:", error);
      const errorResponse: ChatMessage = { role: Role.MODEL, text: "Apologies, an error occurred. Could you please repeat that?" };
      updateSession(activeSessionId, { messages: [...updatedMessages, errorResponse] });
    } finally {
      setIsLoading(false);
    }
  }, [chatSession, activeSessionId, activeSession]);

    const handleUpdateCanvasState = useCallback((newState: CanvasState) => {
        if (activeSessionId) {
            updateSession(activeSessionId, { canvasState: newState });
        }
    }, [activeSessionId]);

    const handleSubmitCanvas = useCallback(async () => {
        if (!activeSession || !activeSession.canvasState) return;

        setIsLoading(true);
        const serializedCanvas = serializeCanvasState(activeSession.canvasState);
        const userMessage: ChatMessage = { 
            role: Role.USER, 
            text: serializedCanvas,
            imageUrl: activeSession.canvasState.sections.solveImageUrl 
        };
        
        const updatedMessages = [...(activeSession?.messages || []), userMessage];
        // This update will trigger the useEffect to create the correct chat session
        updateSession(activeSession.id, { messages: updatedMessages, isCanvasSubmitted: true });
        // This will trigger the AI response in the useEffect
        setIsAwaitingReviewResponse(true);
        // Switch view back to chat
        setTextModeTab('chat');

    }, [activeSession]);

    const handleGenerateCheatSheet = useCallback(async (modelType: 'flash' | 'pro') => {
        if (!activeSession || !activeSession.canvasState?.task) return;
    
        setIsLoading(true);
        try {
            const generatedContent = await generateCheatSheet(activeSession.canvasState.task, modelType);
            updateSession(activeSession.id, { cheatSheetContent: generatedContent });
        } catch (error) {
            console.error(error);
            updateSession(activeSession.id, { cheatSheetContent: "Sorry, I couldn't generate an answer. Please try again." });
        } finally {
            setIsLoading(false);
        }
    }, [activeSession]);
  
  const handleFinishSession = useCallback(async () => {
    if (!activeSessionId || !activeSession || isLoading) return;
    
    setIsTimeLowModalOpen(false); // Ensure modal is closed
    if (activeSession.isFinished) return;
    if (activeSession.mode === ChatMode.VOICE) {
        updateSession(activeSessionId, { isFinished: true });
        return;
    }
    
    // For Text mode
    if (chatSession) {
        const finishMessage = "I'm finished with the exercise. Please provide your feedback.";
        const userMessage: ChatMessage = { role: Role.USER, text: finishMessage };
        
        const updatedMessages = [...(activeSession?.messages || []), userMessage];
        updateSession(activeSessionId, { messages: updatedMessages });
        setIsLoading(true);

        try {
          const response = await chatSession.sendMessage({ message: finishMessage });
          const modelResponse: ChatMessage = { role: Role.MODEL, text: response.text };
          updateSession(activeSessionId, { 
            messages: [...updatedMessages, modelResponse],
            isFinished: true,
          });
        } catch (error) {
          console.error("Failed to finish session:", error);
          const errorResponse: ChatMessage = { role: Role.MODEL, text: "Apologies, an error occurred while trying to get feedback." };
          updateSession(activeSessionId, { messages: [...updatedMessages, errorResponse] });
        } finally {
          setIsLoading(false);
        }
    } else {
        updateSession(activeSessionId, { isFinished: true });
    }
  }, [chatSession, isLoading, activeSessionId, activeSession]);

  const handleUpdateVoiceMessages = useCallback((messages: ChatMessage[]) => {
      if (activeSessionId) {
          updateSession(activeSessionId, { messages });
      }
  }, [activeSessionId]);

  const handleLoadSession = (sessionId: string) => {
    setActiveSessionId(sessionId);
    setSetupStep('active');
    setTextModeTab('chat');
  };

  const handleDeleteSession = (sessionId: string) => {
    setSessions(prev => {
        const newSessions = prev.filter(s => s.id !== sessionId);
        if (activeSessionId === sessionId) {
            if (newSessions.length > 0) {
                setActiveSessionId(newSessions[0].id);
            } else {
                setActiveSessionId(null);
                setSetupStep('difficulty');
            }
        }
        return newSessions;
    });
    setTextModeTab('chat');
  };
  
  const handleNewSessionClick = () => {
    setActiveSessionId(null);
    setPendingSessionConfig(null);
    setSetupStep('difficulty');
    setTextModeTab('chat');
  };

  const handleProceedToTimerSetup = (difficulty: Difficulty, mode: ChatMode) => {
    setPendingSessionConfig({ difficulty, mode });
    setSetupStep('timer');
  };
  
  const handleAddTime = (minutes: number) => {
    if (!activeSession) return;
    const newDuration = (activeSession.duration || 0) + (minutes * 60);
    updateSession(activeSession.id, { duration: newDuration });
    setIsTimeLowModalOpen(false);
  };

  const handleDismissTimeLowModal = () => {
    setIsTimeLowModalOpen(false);
  };

  const toggleSidebar = () => setIsSidebarVisible(prev => !prev);
  const toggleFullScreen = () => setIsFullScreen(prev => !prev);

  const renderContent = () => {
    if (isSessionStarting && pendingSessionConfig) {
      return (
        <div className="flex flex-col items-center justify-center h-full p-8 text-center">
          <LoadingSpinner className="h-12 w-12 text-brand-primary mb-6" />
          <h2 className="text-2xl font-semibold mb-2 text-brand-text">Starting Your Interview...</h2>
          <p className="text-brand-text-muted max-w-sm">
            Preparing a <span className="font-semibold text-brand-text">{pendingSessionConfig.difficulty}</span> challenge in <span className="font-semibold text-brand-text">{pendingSessionConfig.mode} Mode</span>. Get ready to showcase your skills!
          </p>
        </div>
      );
    }

    if (setupStep === 'difficulty' || (setupStep === 'active' && !activeSession)) {
      return <DifficultySelector onProceedToTimerSetup={handleProceedToTimerSetup} />;
    }

    if (setupStep === 'timer') {
      return <TimerSetup onStartSession={startNewSession} onBack={() => setSetupStep('difficulty')} />;
    }

    if (activeSession) {
      if (activeSession.mode === ChatMode.VOICE) {
        return (
          <div className="flex flex-col h-full relative">
              <div className="flex justify-end items-center px-4 pt-4 pb-2 max-w-4xl mx-auto w-full">
                  {activeSession.startTime && (
                    <Timer 
                        startTime={new Date(activeSession.startTime)} 
                        duration={activeSession.duration}
                        isFinished={activeSession.isFinished}
                        onTimeLow={() => setIsTimeLowModalOpen(true)}
                        onTimerEnd={handleFinishSession}
                    />
                  )}
              </div>
              <VoiceInterface 
                  session={activeSession}
                  messages={activeSession.messages}
                  isFinished={activeSession.isFinished}
                  onFinish={handleFinishSession}
                  onUpdateMessages={handleUpdateVoiceMessages}
              />
          </div>
        );
      }
  
      // Text mode with Chat/Canvas tabs
      if (activeSession.mode === ChatMode.TEXT) {
        return (
            <div className="flex flex-col h-full">
                <div className="flex items-center justify-center space-x-8 border-b border-brand-secondary">
                    <button 
                        onClick={() => setTextModeTab('chat')} 
                        className={`py-3 text-lg font-semibold transition-colors ${textModeTab === 'chat' ? 'text-brand-text border-b-2 border-brand-primary' : 'text-brand-text-muted hover:text-brand-text'}`}
                    >
                        Chat
                    </button>
                    <button 
                        onClick={() => setTextModeTab('canvas')} 
                        className={`py-3 text-lg font-semibold transition-colors ${textModeTab === 'canvas' ? 'text-brand-text border-b-2 border-brand-primary' : 'text-brand-text-muted hover:text-brand-text'}`}
                    >
                        Canvas
                    </button>
                     <button 
                        onClick={() => setTextModeTab('cheatsheet')} 
                        className={`py-3 text-lg font-semibold transition-colors ${textModeTab === 'cheatsheet' ? 'text-brand-text border-b-2 border-brand-primary' : 'text-brand-text-muted hover:text-brand-text'}`}
                    >
                        Cheat Sheet
                    </button>
                </div>

                <div className="flex-1 min-h-0">
                {textModeTab === 'chat' ? (
                     <div className="flex flex-col h-full relative">
                        <div className="flex justify-between items-center px-4 pt-4 pb-2 max-w-4xl mx-auto w-full">
                            <div className="flex items-center gap-4">
                            {!activeSession.isFinished && (
                                <button
                                onClick={handleFinishSession}
                                disabled={isLoading}
                                className="px-4 py-2 text-sm font-medium text-white bg-amber-600 border border-amber-700 rounded-lg hover:bg-amber-700 transition-colors disabled:bg-amber-800 disabled:cursor-not-allowed"
                                >
                                Finish Session
                                </button>
                            )}
                            </div>
                            {activeSession.startTime && (
                                <Timer 
                                    startTime={new Date(activeSession.startTime)} 
                                    duration={activeSession.duration}
                                    isFinished={activeSession.isFinished}
                                    onTimeLow={() => setIsTimeLowModalOpen(true)}
                                    onTimerEnd={handleFinishSession}
                                />
                            )}
                        </div>
                        <ChatWindow messages={activeSession.messages} isLoading={isLoading} />
                        <InputBar onSendMessage={handleSendMessage} isLoading={isLoading} isSessionFinished={activeSession.isFinished} />
                    </div>
                ) : textModeTab === 'canvas' ? (
                    activeSession.canvasState && (
                        <CanvasView 
                            session={activeSession} 
                            onStateChange={handleUpdateCanvasState}
                            onSubmit={handleSubmitCanvas}
                            isLoading={isLoading}
                            onFinish={handleFinishSession}
                            onTimeLow={() => setIsTimeLowModalOpen(true)}
                            onTimerEnd={handleFinishSession}
                        />
                    )
                ) : (
                    <CheatSheetView
                        session={activeSession}
                        onGenerate={handleGenerateCheatSheet}
                        isLoading={isLoading}
                        onBack={() => setTextModeTab('chat')}
                    />
                )}
                </div>
            </div>
        )
      }
    }
    
    return <DifficultySelector onProceedToTimerSetup={handleProceedToTimerSetup} />;
  }

  return (
    <div className="flex flex-col h-screen font-sans bg-brand-bg">
      {!isFullScreen && <Header />}
      {isTimeLowModalOpen && activeSession && !activeSession.isFinished && (
        <TimeLowModal 
            onAddTime={handleAddTime}
            onFinish={handleFinishSession}
            onDismiss={handleDismissTimeLowModal}
        />
      )}
      <div className="flex-1 flex overflow-hidden relative">
        <SessionHistory
          sessions={sessions}
          activeSessionId={activeSessionId}
          onLoadSession={handleLoadSession}
          onNewSession={handleNewSessionClick}
          onDeleteSession={handleDeleteSession}
          isSidebarVisible={isSidebarVisible}
          onToggleSidebar={toggleSidebar}
        />
        <main className="flex-1 flex flex-col overflow-hidden relative">
          {!isSidebarVisible && (
            <button
              onClick={toggleSidebar}
              className="absolute top-1/2 -translate-y-1/2 left-0 z-10 p-1 bg-brand-surface rounded-r-lg border-y border-r border-brand-secondary hover:bg-brand-secondary"
              aria-label="Show session history"
            >
              <ChevronRightIcon className="h-6 w-6 text-brand-text-muted" />
            </button>
          )}
          {setupStep === 'active' && activeSession && (
            <button
              onClick={toggleFullScreen}
              className="absolute top-4 right-4 z-20 p-2 bg-brand-surface rounded-full border border-brand-secondary text-brand-text-muted hover:text-brand-text transition-colors"
              aria-label={isFullScreen ? 'Exit Full Screen' : 'Enter Full Screen'}
            >
              {isFullScreen ? (
                <ExitFullScreenIcon className="h-5 w-5" />
              ) : (
                <EnterFullScreenIcon className="h-5 w-5" />
              )}
            </button>
          )}
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default App;