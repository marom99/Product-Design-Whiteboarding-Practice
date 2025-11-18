import React, { useState, useEffect, useRef, useCallback } from 'react';
import { LiveServerMessage, Blob } from '@google/genai';
import { ChatMessage, Difficulty, Role, Session } from '../types';
import { connectToLiveSession } from '../services/geminiService';
import { encode, decode, decodeAudioData } from '../utils/audio';
import { AiIcon, MicrophoneIcon, StopIcon, UserIcon } from './icons';

interface VoiceInterfaceProps {
  session: Session;
  messages: ChatMessage[];
  isFinished: boolean;
  onFinish: () => void;
  onUpdateMessages: (messages: ChatMessage[]) => void;
}

enum ConnectionState {
  IDLE = 'idle',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
  ERROR = 'error',
}

const VoiceInterface: React.FC<VoiceInterfaceProps> = ({
  session,
  messages,
  isFinished,
  onFinish,
  onUpdateMessages,
}) => {
  const [connectionState, setConnectionState] = useState<ConnectionState>(ConnectionState.IDLE);
  const [currentInput, setCurrentInput] = useState('');
  const [currentOutput, setCurrentOutput] = useState('');

  // FIX: The `LiveSession` type is not exported from the '@google/genai' package.
  // The type for the ref has been changed to `any` to resolve the error.
  const sessionPromiseRef = useRef<Promise<any> | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const nextStartTimeRef = useRef<number>(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const currentInputRef = useRef('');
  const currentOutputRef = useRef('');

  useEffect(() => {
    currentInputRef.current = currentInput;
    currentOutputRef.current = currentOutput;
  }, [currentInput, currentOutput]);

  const cleanup = useCallback(() => {
    sessionPromiseRef.current?.then(session => session.close());
    sessionPromiseRef.current = null;

    mediaStreamRef.current?.getTracks().forEach(track => track.stop());
    mediaStreamRef.current = null;

    if (scriptProcessorRef.current) {
        scriptProcessorRef.current.disconnect();
        scriptProcessorRef.current.onaudioprocess = null;
        scriptProcessorRef.current = null;
    }
    if (inputAudioContextRef.current && inputAudioContextRef.current.state !== 'closed') {
      inputAudioContextRef.current.close();
    }
    if (outputAudioContextRef.current && outputAudioContextRef.current.state !== 'closed') {
      outputAudioContextRef.current.close();
    }

    sourcesRef.current.forEach(source => source.stop());
    sourcesRef.current.clear();

    setConnectionState(ConnectionState.DISCONNECTED);
  }, []);

  const handleMessage = useCallback(async (message: LiveServerMessage) => {
    if (message.serverContent?.outputTranscription) {
      setCurrentOutput(prev => prev + message.serverContent.outputTranscription.text);
    }
    if (message.serverContent?.inputTranscription) {
      setCurrentInput(prev => prev + message.serverContent.inputTranscription.text);
    }

    if (message.serverContent?.turnComplete) {
      const fullInput = currentInputRef.current;
      const fullOutput = currentOutputRef.current;
      
      const newMessages: ChatMessage[] = [];
      if (fullInput.trim()) {
        newMessages.push({ role: Role.USER, text: fullInput });
      }
      if (fullOutput.trim()) {
        newMessages.push({ role: Role.MODEL, text: fullOutput });
      }
      if(newMessages.length > 0) {
        onUpdateMessages([...messages, ...newMessages]);
      }
      
      setCurrentInput('');
      setCurrentOutput('');
    }

    const audioData = message.serverContent?.modelTurn?.parts[0]?.inlineData.data;
    if (audioData && outputAudioContextRef.current) {
      const outputCtx = outputAudioContextRef.current;
      nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputCtx.currentTime);
      
      const audioBuffer = await decodeAudioData(decode(audioData), outputCtx, 24000, 1);
      const source = outputCtx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(outputCtx.destination);
      source.addEventListener('ended', () => sourcesRef.current.delete(source));
      
      source.start(nextStartTimeRef.current);
      nextStartTimeRef.current += audioBuffer.duration;
      sourcesRef.current.add(source);
    }
  }, [messages, onUpdateMessages]);

  const startSession = useCallback(async () => {
    setConnectionState(ConnectionState.CONNECTING);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      // Fix: Add type assertion to window to access webkitAudioContext for broader browser compatibility.
      inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      // Fix: Add type assertion to window to access webkitAudioContext for broader browser compatibility.
      outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      nextStartTimeRef.current = 0;

      const callbacks = {
        onopen: () => {
          const source = inputAudioContextRef.current!.createMediaStreamSource(stream);
          const scriptProcessor = inputAudioContextRef.current!.createScriptProcessor(4096, 1, 1);
          scriptProcessorRef.current = scriptProcessor;

          scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
            const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
            // Fix: Optimized PCM blob creation to follow best practices for performance.
            const l = inputData.length;
            const int16 = new Int16Array(l);
            for (let i = 0; i < l; i++) {
              int16[i] = inputData[i] * 32768;
            }
            const pcmBlob: Blob = {
                data: encode(new Uint8Array(int16.buffer)),
                mimeType: 'audio/pcm;rate=16000',
            };
            sessionPromiseRef.current?.then(session => session.sendRealtimeInput({ media: pcmBlob }));
          };
          source.connect(scriptProcessor);
          scriptProcessor.connect(inputAudioContextRef.current!.destination);
          setConnectionState(ConnectionState.CONNECTED);
        },
        onmessage: handleMessage,
        onerror: (e: ErrorEvent) => {
          console.error('Live session error:', e);
          setConnectionState(ConnectionState.ERROR);
          cleanup();
        },
        onclose: (e: CloseEvent) => {
          setConnectionState(ConnectionState.DISCONNECTED);
          cleanup();
        },
      };

      const initialPrompt = session.messages[0]?.text || `Provide a ${session.difficulty} product design challenge.`;
      sessionPromiseRef.current = connectToLiveSession(callbacks, initialPrompt);
      await sessionPromiseRef.current;

    } catch (err) {
      console.error('Failed to start voice session:', err);
      setConnectionState(ConnectionState.ERROR);
    }
  }, [cleanup, handleMessage, session]);

  useEffect(() => {
    if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, currentInput, currentOutput]);

  useEffect(() => {
    // Cleanup on component unmount
    return () => cleanup();
  }, [cleanup]);

  const renderStatus = () => {
    if (isFinished) {
        return connectionState === ConnectionState.CONNECTED 
            ? 'Exercise finished. Ask for feedback or end session.'
            : 'Session ended.';
    }
    switch (connectionState) {
      case ConnectionState.IDLE: return 'Click "Start Session" to begin.';
      case ConnectionState.CONNECTING: return 'Connecting...';
      case ConnectionState.CONNECTED: return 'Connected. The interview will begin shortly.';
      case ConnectionState.DISCONNECTED: return 'Session ended.';
      case ConnectionState.ERROR: return 'An error occurred. Please refresh and try again.';
      default: return '';
    }
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6">
            {messages.map((msg, index) => (
                <div key={index} className={`flex items-start gap-4 ${msg.role === Role.USER ? 'flex-row-reverse' : ''}`}>
                    <div className={`flex-shrink-0 mt-1 h-8 w-8 p-1.5 rounded-full text-white ${msg.role === Role.USER ? 'bg-indigo-500' : 'bg-zinc-600'}`}>
                        {msg.role === Role.USER ? <UserIcon /> : <AiIcon />}
                    </div>
                    <div className={`max-w-xl p-4 rounded-xl shadow-md ${msg.role === Role.USER ? 'bg-brand-primary text-white rounded-br-none' : 'bg-brand-surface text-brand-text rounded-bl-none'}`}>
                        <p className="whitespace-pre-wrap">{msg.text}</p>
                    </div>
                </div>
            ))}
            {currentOutput && (
                <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 mt-1 h-8 w-8 p-1.5 rounded-full text-white bg-zinc-600"><AiIcon /></div>
                    <div className="max-w-xl p-4 rounded-xl shadow-md bg-brand-surface text-brand-text rounded-bl-none opacity-70">
                        <p className="whitespace-pre-wrap">{currentOutput}</p>
                    </div>
                </div>
            )}
            {currentInput && (
                <div className="flex items-start gap-4 flex-row-reverse">
                    <div className="flex-shrink-0 mt-1 h-8 w-8 p-1.5 rounded-full text-white bg-indigo-500"><UserIcon /></div>
                    <div className="max-w-xl p-4 rounded-xl shadow-md bg-brand-primary text-white rounded-br-none opacity-70">
                        <p className="whitespace-pre-wrap">{currentInput}</p>
                    </div>
                </div>
            )}
        </div>
        <div className="p-4 border-t border-brand-secondary bg-brand-bg flex flex-col items-center justify-center space-y-4">
            <div className="flex items-center space-x-4">
                {connectionState !== ConnectionState.CONNECTED ? (
                    <button
                        onClick={startSession}
                        disabled={connectionState === ConnectionState.CONNECTING || isFinished}
                        className="p-4 bg-green-600 text-white rounded-full hover:bg-green-700 disabled:bg-green-800 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                    >
                        <MicrophoneIcon className="h-6 w-6" />
                        <span>Start Session</span>
                    </button>
                ) : (
                    <button
                        onClick={cleanup}
                        className="p-4 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors flex items-center gap-2"
                    >
                        <StopIcon className="h-6 w-6" />
                        <span>End Session</span>
                    </button>
                )}
                {!isFinished && connectionState === ConnectionState.CONNECTED && (
                    <button
                        onClick={onFinish}
                        className="px-4 py-2 text-sm font-medium text-white bg-amber-600 border border-amber-700 rounded-lg hover:bg-amber-700 transition-colors"
                    >
                        Finish Exercise
                    </button>
                )}
            </div>
            <p className="text-sm text-brand-text-muted h-5">{renderStatus()}</p>
        </div>
    </div>
  );
};

export default VoiceInterface;
