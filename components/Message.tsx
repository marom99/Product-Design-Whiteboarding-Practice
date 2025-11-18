import React from 'react';
import { Role } from '../types';
import { UserIcon, AiIcon } from './icons';

interface MessageProps {
  role: Role;
  text: string;
  imageUrl?: string;
}

const Message: React.FC<MessageProps> = ({ role, text, imageUrl }) => {
  const isUser = role === Role.USER;

  const containerClasses = `flex items-start gap-4 ${isUser ? 'flex-row-reverse' : ''}`;
  const bubbleClasses = `max-w-xl p-4 rounded-xl shadow-md ${
    isUser
      ? 'bg-brand-primary text-white rounded-br-none'
      : 'bg-brand-surface text-brand-text rounded-bl-none'
  }`;
  const iconClasses = `h-8 w-8 p-1.5 rounded-full text-white ${isUser ? 'bg-indigo-500' : 'bg-zinc-600'}`;

  return (
    <div className={containerClasses}>
      <div className={`flex-shrink-0 mt-1 ${iconClasses}`}>
        {isUser ? <UserIcon /> : <AiIcon />}
      </div>
      <div className={bubbleClasses}>
        {imageUrl && (
            <img 
                src={imageUrl} 
                alt="User upload" 
                className="max-w-xs rounded-lg mb-2 border border-brand-secondary"
            />
        )}
        <p className="whitespace-pre-wrap">{text}</p>
      </div>
    </div>
  );
};

export default Message;