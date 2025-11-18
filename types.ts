// FIX: Removed circular import of 'Role' from the same file, which caused a conflict.
export enum Role {
  USER = 'user',
  MODEL = 'model',
}

export interface ChatMessage {
  role: Role;
  text: string;
  imageUrl?: string;
}

export enum Difficulty {
  EASY = 'Easy',
  MEDIUM = 'Medium',
  HARD = 'Hard',
}

export enum ChatMode {
  TEXT = 'Text',
  VOICE = 'Voice',
}

// New interfaces for Canvas Mode
export interface PrioritizationItem {
  id: string;
  text: string;
  effort: number; // 0-100
  impact: number; // 0-100
}

export interface CanvasState {
  task: string;
  sections: {
    why: string;
    who: string;
    whenAndWhere: string;
    what: string;
    solve: string;
    solveImageUrl?: string;
    how: string;
  };
  prioritizationItems: PrioritizationItem[];
}


export interface Session {
  id: string;
  title: string;
  difficulty: Difficulty;
  mode: ChatMode;
  startTime: string; // ISO string
  isFinished: boolean;
  messages: ChatMessage[];
  duration?: number; // Duration in seconds
  canvasState?: CanvasState;
  isCanvasSubmitted?: boolean;
  cheatSheetContent?: string;
}