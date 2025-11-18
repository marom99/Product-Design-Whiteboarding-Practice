import React, { useState, useRef, useEffect } from 'react';
import { SendIcon, PaperClipIcon, TrashIcon } from './icons';
import { fileToDataUrl } from '../utils/image';

interface InputBarProps {
  onSendMessage: (message: string, imageUrl?: string) => void;
  isLoading: boolean;
  isSessionFinished: boolean;
}

const InputBar: React.FC<InputBarProps> = ({ onSendMessage, isLoading, isSessionFinished }) => {
  const [input, setInput] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      // Reset height to allow shrinking
      textareaRef.current.style.height = 'auto';
      // Set height to the scroll height to fit content
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if ((input.trim() || image) && !isLoading) {
      onSendMessage(input.trim(), image || undefined);
      setInput('');
      setImage(null);
      if(fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      // Reset textarea height after sending
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const dataUrl = await fileToDataUrl(file);
        setImage(dataUrl);
      } catch (error) {
        console.error("Error converting file to data URL:", error);
        setImage(null);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmit(e);
    }
  };


  return (
    <div className="p-4 border-t border-brand-secondary bg-brand-bg">
        {image && (
            <div className="relative w-24 h-24 mb-2 p-1 border border-brand-secondary rounded-lg">
                <img src={image} alt="Preview" className="w-full h-full object-cover rounded-md" />
                <button 
                    onClick={() => setImage(null)}
                    className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1"
                    aria-label="Remove image"
                >
                    <TrashIcon className="w-4 h-4" />
                </button>
            </div>
        )}
      <form onSubmit={handleSubmit} className="flex items-end space-x-4 max-w-4xl mx-auto">
        <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/png, image/jpeg, image/webp"
            className="hidden"
        />
        <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            className="p-3 text-brand-text-muted hover:text-brand-text focus:outline-none disabled:opacity-50"
            aria-label="Attach image"
        >
            <PaperClipIcon className="h-6 w-6" />
        </button>
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isSessionFinished ? "Ask for more detailed feedback..." : "Your response..."}
          disabled={isLoading}
          rows={1}
          className="flex-1 bg-brand-surface border border-brand-secondary rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-brand-primary resize-none disabled:opacity-50 max-h-40"
        />
        <button
          type="submit"
          disabled={isLoading || (!input.trim() && !image)}
          className="p-3 bg-brand-primary text-white rounded-full hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-opacity-75 disabled:bg-brand-secondary disabled:cursor-not-allowed transition-colors"
        >
          <SendIcon className="h-6 w-6" />
        </button>
      </form>
    </div>
  );
};

export default InputBar;