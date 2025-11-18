import React, { useRef, useEffect } from 'react';
import { ChatMessage } from '../types';
import Message from './Message';
import { LoadingSpinner, AiIcon } from './icons';

interface ChatWindowProps {
  messages: ChatMessage[];
  isLoading: boolean;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ messages, isLoading }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6">
      {messages.map((msg, index) => (
        <Message key={index} role={msg.role} text={msg.text} imageUrl={msg.imageUrl} />
      ))}
      {isLoading && (
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 mt-1 h-8 w-8 p-1.5 rounded-full text-white bg-zinc-600">
            <AiIcon />
          </div>
          <div className="max-w-xl p-4 rounded-xl shadow-md bg-brand-surface text-brand-text rounded-bl-none flex items-center">
            <LoadingSpinner className="h-5 w-5 mr-3" />
            <span>Thinking...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatWindow;