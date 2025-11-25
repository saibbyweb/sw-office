export interface AdminUser {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  isOnline: boolean;
  currentStatus: string;
  archived: boolean;
  slackUserId?: string;
  salaryINR?: number;
}

export interface Project {
  id: string;
  name: string;
}

export interface Break {
  id: string;
  type: string;
  startTime: string;
  endTime: string | null;
  duration: number;
}

export interface WorkLog {
  id: string;
  content: string;
  links: string[];
  createdAt: string;
  project?: Project;
}

export interface Segment {
  id: string;
  type: 'WORK' | 'BREAK';
  startTime: string;
  endTime: string | null;
  duration: number;
  project?: Project;
  break?: Break;
}

export interface AdminSession {
  id: string;
  startTime: string;
  endTime: string | null;
  status: string;
  totalDuration: number;
  totalBreakTime: number;
  user: AdminUser;
  project?: Project;
  segments: Segment[];
  breaks: Break[];
} 