export interface Project {
  id: string;
  name: string;
  isActive: boolean;
  slug: string;
}

export interface GetProjectsData {
  projects: Project[];
}

export interface Session {
  id: string;
  startTime: string;
  endTime?: string;
  status: 'ACTIVE' | 'COMPLETED' | 'TERMINATED';
  projectId?: string;
  project?: {
    id: string;
    name: string;
  };
  totalDuration: number;
  totalBreakTime: number;
  userId: string;
}

export interface StartSessionData {
  startSession: Session;
}

export interface StartSessionInput {
  projectId: string;
}

export interface StartSessionVariables {
  input: StartSessionInput;
}

export interface ActiveSessionData {
  activeSession: Session | null;
}

export enum BreakType {
  SHORT = 'SHORT',
  LUNCH = 'LUNCH',
  OTHER = 'OTHER'
}

export interface Break {
  id: string;
  type: BreakType;
  startTime: string;
  endTime?: string;
  duration: number;
  sessionId: string;
}

export interface StartBreakInput {
  type: BreakType;
  sessionId: string;
}

export interface StartBreakData {
  startBreak: Break;
}

export interface EndBreakData {
  endBreak: Break;
}

export interface EndBreakVariables {
  breakId: string;
}

export interface StartBreakVariables {
  input: StartBreakInput;
} 