// Session Types
export interface SessionState {
  isActive: boolean;
  startTime: number;
  project: string;
  totalDuration: number;
  breakTime: number;
  isOnBreak: boolean;
  currentBreak?: {
    type: string;
    startTime: number;
  };
}

// Project Types
export interface Project {
  id: string;
  name: string;
  isCustom: boolean;
}

export interface ProjectState {
  projects: Project[];
  currentProject?: Project;
  recentProjects: Project[];
}

// Work Log Types
export interface WorkLog {
  id: string;
  content: string;
  links: string[];
  timestamp: number;
  project: string;
}

export interface WorkLogState {
  logs: WorkLog[];
  isEditing: boolean;
  currentLog?: WorkLog;
}

// Common Types
export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children?: React.ReactNode;
}

export type BreakType = 'short' | 'lunch' | 'other';

export interface NotificationProps {
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
}

// Form Types
export interface FormInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
  placeholder?: string;
}

// Theme Types
export interface Theme {
  colors: {
    primary: string;
    secondary: string;
    success: string;
    warning: string;
    error: string;
    background: string;
    text: string;
  };
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
} 