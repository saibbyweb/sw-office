import React, { createContext, useContext, useReducer, useCallback } from 'react';
import { SessionState, ProjectState, WorkLogState, Project, WorkLog } from '../types';

interface AppState {
  session: SessionState;
  projects: ProjectState;
  workLogs: WorkLogState;
}

type Action =
  | { type: 'START_SESSION'; payload: { project: string; startTime: number } }
  | { type: 'END_SESSION' }
  | { type: 'START_BREAK'; payload: { type: string; startTime: number } }
  | { type: 'END_BREAK' }
  | { type: 'SWITCH_PROJECT'; payload: { project: string } }
  | { type: 'ADD_PROJECT'; payload: Project }
  | { type: 'ADD_WORK_LOG'; payload: WorkLog }
  | { type: 'EDIT_WORK_LOG'; payload: { id: string; content: string; links: string[] } };

const initialState: AppState = {
  session: {
    isActive: false,
    startTime: 0,
    project: '',
    totalDuration: 0,
    breakTime: 0,
    isOnBreak: false
  },
  projects: {
    projects: [],
    recentProjects: []
  },
  workLogs: {
    logs: [],
    isEditing: false
  }
};

const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<Action>;
  startSession: (project: string) => void;
  endSession: () => void;
  startBreak: (type: string) => void;
  endBreak: () => void;
  switchProject: (project: string) => void;
  addWorkLog: (content: string, links: string[]) => void;
} | undefined>(undefined);

const appReducer = (state: AppState, action: Action): AppState => {
  switch (action.type) {
    case 'START_SESSION':
      return {
        ...state,
        session: {
          ...state.session,
          isActive: true,
          startTime: action.payload.startTime,
          project: action.payload.project
        }
      };
    case 'END_SESSION':
      return {
        ...state,
        session: {
          ...initialState.session
        }
      };
    case 'START_BREAK':
      return {
        ...state,
        session: {
          ...state.session,
          isOnBreak: true,
          currentBreak: {
            type: action.payload.type,
            startTime: action.payload.startTime
          }
        }
      };
    case 'END_BREAK':
      return {
        ...state,
        session: {
          ...state.session,
          isOnBreak: false,
          currentBreak: undefined,
          breakTime: state.session.breakTime + (Date.now() - (state.session.currentBreak?.startTime || 0))
        }
      };
    case 'SWITCH_PROJECT':
      return {
        ...state,
        session: {
          ...state.session,
          project: action.payload.project
        }
      };
    case 'ADD_PROJECT':
      return {
        ...state,
        projects: {
          ...state.projects,
          projects: [...state.projects.projects, action.payload]
        }
      };
    case 'ADD_WORK_LOG':
      return {
        ...state,
        workLogs: {
          ...state.workLogs,
          logs: [...state.workLogs.logs, action.payload]
        }
      };
    case 'EDIT_WORK_LOG':
      return {
        ...state,
        workLogs: {
          ...state.workLogs,
          logs: state.workLogs.logs.map(log =>
            log.id === action.payload.id
              ? { ...log, content: action.payload.content, links: action.payload.links }
              : log
          )
        }
      };
    default:
      return state;
  }
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  const startSession = useCallback((project: string) => {
    dispatch({ type: 'START_SESSION', payload: { project, startTime: Date.now() } });
  }, []);

  const endSession = useCallback(() => {
    dispatch({ type: 'END_SESSION' });
  }, []);

  const startBreak = useCallback((type: string) => {
    dispatch({ type: 'START_BREAK', payload: { type, startTime: Date.now() } });
  }, []);

  const endBreak = useCallback(() => {
    dispatch({ type: 'END_BREAK' });
  }, []);

  const switchProject = useCallback((project: string) => {
    dispatch({ type: 'SWITCH_PROJECT', payload: { project } });
  }, []);

  const addWorkLog = useCallback((content: string, links: string[]) => {
    dispatch({
      type: 'ADD_WORK_LOG',
      payload: {
        id: Date.now().toString(),
        content,
        links,
        timestamp: Date.now(),
        project: state.session.project
      }
    });
  }, [state.session.project]);

  const value = {
    state,
    dispatch,
    startSession,
    endSession,
    startBreak,
    endBreak,
    switchProject,
    addWorkLog
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}; 