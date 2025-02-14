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
  userId: string;
  projectId: string | null;
  project: Project | null;
  status: string;
  startTime: string;
  endTime: string | null;
  segments: Array<{
    id: string;
    type: 'WORK' | 'BREAK';
    startTime: string;
    endTime: string | null;
    duration: number;
    project?: Project;
    break?: Break;
  }>;
  breaks: Break[];
  duration: number;
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
  type: string;
  startTime: string;
  endTime: string | null;
  duration: number;
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

export interface SwitchProjectInput {
  projectId: string;
  sessionId: string;
}

export interface SwitchProjectData {
  switchProject: Session;
}

export interface SwitchProjectVariables {
  input: SwitchProjectInput;
}

export interface WorkLog {
  id: string;
  content: string;
  links: string[];
  createdAt: string;
  project: {
    id: string;
    name: string;
  };
  user: {
    id: string;
    name: string;
  };
}

export interface SessionWorkLogsData {
  sessionWorkLogs: WorkLog[];
}

export interface SessionWorkLogsVariables {
  sessionId: string;
}

export interface AddWorkLogInput {
  sessionId: string;
  projectId: string;
  content: string;
  links: string[];
}

export interface UpdateWorkLogInput {
  workLogId: string;
  content: string;
  links: string[];
}

export interface AddWorkLogData {
  addWorkLog: WorkLog;
}

export interface UpdateWorkLogData {
  updateWorkLog: WorkLog;
} 