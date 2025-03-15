import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import WorkflowView from './pages/WorkflowView';
import Workflow from './pages/Workflow';

export default function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500/20 via-purple-500/20 to-pink-500/20">
      <div className="absolute inset-0 -z-10 h-full w-full bg-white bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]"></div>
      <Router>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/workflow/:sessionId" element={<WorkflowView />} />
          <Route path="/workflow-v2/:sessionId" element={<Workflow />} />
        </Routes>
      </Router>
    </div>
  );
}
