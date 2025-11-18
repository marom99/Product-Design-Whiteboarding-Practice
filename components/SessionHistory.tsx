import React from 'react';
import { Session } from '../types';
import { HistoryIcon, PlusIcon, TrashIcon, ChevronLeftIcon } from './icons';

interface SessionHistoryProps {
  sessions: Session[];
  activeSessionId: string | null;
  onLoadSession: (id: string) => void;
  onNewSession: () => void;
  onDeleteSession: (id: string) => void;
  isSidebarVisible: boolean;
  onToggleSidebar: () => void;
}

const SessionHistory: React.FC<SessionHistoryProps> = ({
  sessions,
  activeSessionId,
  onLoadSession,
  onNewSession,
  onDeleteSession,
  isSidebarVisible,
  onToggleSidebar,
}) => {
  return (
    <aside
      className={`bg-brand-surface border-r border-brand-secondary flex flex-col transition-all duration-300 ease-in-out overflow-hidden ${
        isSidebarVisible ? 'w-80' : 'w-0 border-r-0'
      }`}
    >
      <div className="w-80 h-full flex flex-col">
        <div className="p-4 border-b border-brand-secondary">
          <button
            onClick={onNewSession}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 font-semibold text-white bg-brand-primary rounded-lg shadow-md hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-opacity-75 transition-colors"
          >
            <PlusIcon className="h-5 w-5" />
            New Interview
          </button>
        </div>
        <div className="flex-1 flex flex-col overflow-y-auto">
          <div className="p-4 flex items-center justify-between text-brand-text-muted">
            <div className="flex items-center gap-2">
              <HistoryIcon className="h-5 w-5" />
              <h2 className="font-semibold">Session History</h2>
            </div>
            <button
                onClick={onToggleSidebar}
                className="p-1 rounded-md hover:bg-brand-secondary text-brand-text-muted hover:text-brand-text"
                aria-label="Hide session history"
            >
                <ChevronLeftIcon className="h-5 w-5" />
            </button>
          </div>
          <nav className="px-2 pb-4 flex-1">
            {sessions.length > 0 ? (
              sessions.map((session) => (
                <div
                  key={session.id}
                  onClick={() => onLoadSession(session.id)}
                  className={`group flex items-center justify-between p-3 my-1 rounded-md cursor-pointer transition-colors ${
                    activeSessionId === session.id
                      ? 'bg-brand-primary text-white'
                      : 'text-brand-text-muted hover:bg-brand-secondary hover:text-brand-text'
                  }`}
                >
                  <div className="flex-1 overflow-hidden">
                    <p className="text-sm font-medium truncate">
                      {session.title || 'New Session'}
                    </p>
                    <p
                      className={`text-xs truncate ${
                        activeSessionId === session.id ? 'text-indigo-200' : 'text-gray-500'
                      }`}
                    >
                      {session.difficulty} - {new Date(session.startTime).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteSession(session.id);
                    }}
                    className={`ml-2 p-1 rounded-md hover:bg-red-500 hover:text-white ${
                      activeSessionId === session.id
                        ? 'text-indigo-200'
                        : 'text-gray-500 opacity-0 group-hover:opacity-100'
                    } transition-opacity`}
                    aria-label="Delete session"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              ))
            ) : (
              <p className="px-4 text-sm text-brand-text-muted">No sessions yet.</p>
            )}
          </nav>
        </div>
      </div>
    </aside>
  );
};

export default SessionHistory;