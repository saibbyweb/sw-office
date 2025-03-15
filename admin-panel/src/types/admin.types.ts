export interface AdminUser {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  isOnline: boolean;
  currentStatus: string;
}

export interface AdminSession {
  id: string;
  startTime: string;
  endTime: string | null;
  status: string;
  totalDuration: number;
  totalBreakTime: number;
  project?: {
    id: string;
    name: string;
  };
  segments: Array<{
    id: string;
    type: 'WORK' | 'BREAK';
    startTime: string;
    endTime: string | null;
    duration: number;
    project?: {
      id: string;
      name: string;
    };
    workLogs?: Array<{
      id: string;
      content: string;
      links: string[];
      createdAt: string;
    }>;
  }>;
  breaks: Array<{
    id: string;
    type: string;
    startTime: string;
    endTime: string | null;
    duration: number;
  }>;
} 