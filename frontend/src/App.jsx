import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import NewDashboard from './pages/NewDashboard';
import CyberRange from './pages/CyberRange';
import Courses from './pages/Courses';
import Quiz from './pages/Quiz';
import Admin from './pages/Admin';
import AdminPanel from './pages/AdminPanel';
import ToolManager from './pages/ToolManager';
import Labs from './pages/Labs';
import Profile from './pages/Profile';
import CourseLabs from './pages/CourseLabs';
import CourseLearning from './pages/CourseLearning';

function PrivateRoute({ children }) {
  const { token, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-400"></div>
      </div>
    );
  }

  return token ? children : <Navigate to="/login" />;
}

function PublicRoute({ children }) {
  const { token, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-400"></div>
      </div>
    );
  }

  return token ? <Navigate to="/dashboard" /> : children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
      <Route path="/dashboard" element={<PrivateRoute><NewDashboard /></PrivateRoute>} />
      <Route path="/courses" element={<PrivateRoute><Courses /></PrivateRoute>} />
      <Route path="/quiz" element={<PrivateRoute><Quiz /></PrivateRoute>} />
      <Route path="/admin" element={<PrivateRoute><AdminPanel /></PrivateRoute>} />
      <Route path="/admin/labs/:labId/tools" element={<PrivateRoute><ToolManager /></PrivateRoute>} />
      <Route path="/labs" element={<PrivateRoute><Labs /></PrivateRoute>} />
      <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
      <Route path="/course/:courseId/labs" element={<PrivateRoute><CourseLabs /></PrivateRoute>} />
      <Route path="/course/:courseId/learn" element={<PrivateRoute><CourseLearning /></PrivateRoute>} />
      <Route path="/lab/:labId" element={<PrivateRoute><CyberRange /></PrivateRoute>} />
      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
