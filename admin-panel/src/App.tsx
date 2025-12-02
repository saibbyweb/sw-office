import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Dashboard from './components/Dashboard';
import HRDashboard from './components/HRDashboard';
import Login from './components/Login';
import ProtectedRoute from './components/ProtectedRoute';
import UserSessions from './pages/UserSessions';
import Team from './pages/Team';
import Tasks from './pages/Tasks';
import WorkflowView from './pages/WorkflowView';
import Workflow from './pages/Workflow';
import WorkExceptions from './pages/WorkExceptions';

function AppRoutes() {
  const { login } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={<Login onLogin={login} />} />

      {/* Admin Routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/sessions"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <UserSessions />
          </ProtectedRoute>
        }
      />
      <Route
        path="/team"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <Team />
          </ProtectedRoute>
        }
      />
      <Route
        path="/tasks"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <Tasks />
          </ProtectedRoute>
        }
      />
      <Route
        path="/workflow/:sessionId"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <WorkflowView />
          </ProtectedRoute>
        }
      />
      <Route
        path="/workflow-v2/:sessionId"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <Workflow />
          </ProtectedRoute>
        }
      />
      <Route
        path="/work-exceptions"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <WorkExceptions />
          </ProtectedRoute>
        }
      />
      {/* HR Routes */}
      <Route
        path="/hr"
        element={
          <ProtectedRoute allowedRoles={['hr']}>
            <HRDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/hr/work-exceptions"
        element={
          <ProtectedRoute allowedRoles={['hr']}>
            <WorkExceptions disableDelete={true} backPath="/hr" title="Employee Work Exceptions" />
          </ProtectedRoute>
        }
      />

      {/* Catch all - redirect to login */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500/20 via-purple-500/20 to-pink-500/20">
      <div className="absolute inset-0 -z-10 h-full w-full bg-white bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]"></div>
      <AuthProvider>
        <Router>
          <AppRoutes />
        </Router>
      </AuthProvider>
    </div>
  );
}
