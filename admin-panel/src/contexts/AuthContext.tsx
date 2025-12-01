import { createContext, useContext, useState, ReactNode } from 'react';

interface AuthContextType {
  role: 'admin' | 'hr' | null;
  isAuthenticated: boolean;
  login: (role: 'admin' | 'hr') => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<'admin' | 'hr' | null>(() => {
    // Check localStorage for existing session
    const savedRole = localStorage.getItem('userRole');
    return savedRole as 'admin' | 'hr' | null;
  });

  const login = (userRole: 'admin' | 'hr') => {
    setRole(userRole);
    localStorage.setItem('userRole', userRole);
  };

  const logout = () => {
    setRole(null);
    localStorage.removeItem('userRole');
  };

  return (
    <AuthContext.Provider
      value={{
        role,
        isAuthenticated: role !== null,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
