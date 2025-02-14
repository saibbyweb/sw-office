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