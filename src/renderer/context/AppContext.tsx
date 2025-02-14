import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import { SessionState, ProjectState, WorkLogState, Project, WorkLog } from '../types';

interface AppState {
  session: SessionState;
  projects: {
    items: Project[];
    loading: boolean;
    error: string | null;
  };
  workLogs: WorkLogState;
}

type Action =
  | { type: 'START_SESSION'; payload: { project: string; startTime: number } }
  | { type: 'END_SESSION' }
  | { type: 'START_BREAK'; payload: { id: string; type: string; startTime: number } }
  | { type: 'END_BREAK' }
  | { type: 'SWITCH_PROJECT'; payload: { project: string } }
  | { type: 'ADD_PROJECT'; payload: Project }
  | { type: 'ADD_WORK_LOG'; payload: WorkLog }
  | { type: 'EDIT_WORK_LOG'; payload: { id: string; content: string; links: string[] } }
  | { type: 'UPDATE_ELAPSED_TIME'; payload: { elapsedTime: number } }
  | { type: 'UPDATE_BREAK_TIME'; payload: { breakTime: number } };

const initialState: AppState = {
  session: {
    isActive: false,
    startTime: 0,
    elapsedTime: 0,
    breakTime: 0,
    project: '',
    isOnBreak: false,
    currentBreak: null,
    totalDuration: 0,
    totalActiveTime: 0
  },
  projects: {
    items: [],
    loading: false,
    error: null
  },
  workLogs: {
    logs: [],
    isEditing: false
  }
};

const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<Action>;
  startSession: (project: string, startTime?: number) => void;
  endSession: () => void;
  startBreak: (id: string, type: string) => void;
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
          startTime: action.payload.startTime || Date.now(),
          project: action.payload.project,
          elapsedTime: 0,
          breakTime: 0
        }
      };
    case 'END_SESSION':
      return {
        ...state,
        session: initialState.session
      };
    case 'START_BREAK':
      return {
        ...state,
        session: {
          ...state.session,
          isOnBreak: true,
          currentBreak: {
            id: action.payload.id,
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
          currentBreak: null,
          startTime: Date.now() // Reset start time for active session
        }
      };
    case 'UPDATE_ELAPSED_TIME':
      return {
        ...state,
        session: {
          ...state.session,
          elapsedTime: action.payload.elapsedTime
        }
      };
    case 'UPDATE_BREAK_TIME':
      return {
        ...state,
        session: {
          ...state.session,
          breakTime: action.payload.breakTime
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
          items: [...state.projects.items, action.payload]
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

  // Update elapsed time
  useEffect(() => {
    if (!state.session.isActive) return;

    const updateElapsedTime = () => {
      const now = Date.now();
      if (!state.session.isOnBreak) {
        const newElapsedTime = state.session.elapsedTime + (now - state.session.startTime);
        dispatch({
          type: 'UPDATE_ELAPSED_TIME',
          payload: { elapsedTime: newElapsedTime }
        });
      }
    };

    const intervalId = setInterval(updateElapsedTime, 1000);
    return () => clearInterval(intervalId);
  }, [state.session.isActive, state.session.isOnBreak, state.session.startTime]);

  // Update break time
  useEffect(() => {
    if (!state.session.isOnBreak || !state.session.currentBreak) return;

    const updateBreakTime = () => {
      const now = Date.now();
      const newBreakTime = state.session.breakTime + 
        (now - (state.session.currentBreak?.startTime || 0));
      
      dispatch({
        type: 'UPDATE_BREAK_TIME',
        payload: { breakTime: newBreakTime }
      });
    };

    const intervalId = setInterval(updateBreakTime, 1000);
    return () => clearInterval(intervalId);
  }, [state.session.isOnBreak, state.session.currentBreak]);

  const startSession = useCallback((project: string, startTime?: number) => {
    dispatch({ type: 'START_SESSION', payload: { project, startTime: startTime || Date.now() } });
  }, []);

  const endSession = useCallback(() => {
    dispatch({ type: 'END_SESSION' });
  }, []);

  const startBreak = useCallback((id: string, type: string) => {
    dispatch({ type: 'START_BREAK', payload: { id, type, startTime: Date.now() } });
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