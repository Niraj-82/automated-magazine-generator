// src/App.tsx
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import CustomCursor from './components/ui/CustomCursor';
import ErrorBoundary from './components/ui/ErrorBoundary';
import Sidebar from './components/layout/Sidebar';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import StudentDashboard from './pages/student/StudentDashboard';
import SubmissionDetail from './pages/student/SubmissionDetail';
import FacultyDashboard from './pages/faculty/FacultyDashboard';
import FacultyReview from './pages/faculty/FacultyReview';
import LabDashboard from './pages/lab/LabDashboard';
import UserManagement from './pages/lab/UserManagement';
import NotificationsPage from './pages/shared/NotificationsPage';
import './index.css';

// ── Protected Route wrapper ──
const ProtectedRoute: React.FC<{
  children: React.ReactNode;
  allowedRoles?: string[];
}> = ({ children, allowedRoles }) => {
  const { isAuthenticated, user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: '1rem',
          background: 'var(--bg-primary)',
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            border: '3px solid var(--border-subtle)',
            borderTop: '3px solid var(--accent-indigo)',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }}
        />
        <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    const defaultRoutes: Record<string, string> = {
      student: '/student',
      faculty: '/faculty',
      lab_assistant: '/lab',
    };
    return <Navigate to={defaultRoutes[user.role] || '/login'} replace />;
  }

  return <>{children}</>;
};

// ── App shell with sidebar ──
const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  const isLoginPage = location.pathname === '/login';

  if (!isAuthenticated || isLoginPage) return <>{children}</>;

  return (
    <div className="app-layout">
      <Sidebar />
      <main
        className="main-content"
        style={{
          paddingTop: '2rem',
          marginLeft: 'var(--sidebar-width)',
          transition: 'margin-left 0.3s ease',
        }}
      >
        {children}
      </main>
    </div>
  );
};

// ── Root redirect ──
const RootRedirect: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  const routes: Record<string, string> = {
    student: '/student',
    faculty: '/faculty',
    lab_assistant: '/lab',
  };
  return <Navigate to={routes[user?.role || 'student'] || '/login'} replace />;
};

const AppRoutes: React.FC = () => {
  return (
    <AppShell>
      <Routes>
        {/* Public */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Root redirect */}
        <Route path="/" element={<RootRedirect />} />

        {/* Student routes */}
        <Route
          path="/student"
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <StudentDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/submissions/:id"
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <SubmissionDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/*"
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <StudentDashboard />
            </ProtectedRoute>
          }
        />

        {/* Faculty routes */}
        <Route
          path="/faculty"
          element={
            <ProtectedRoute allowedRoles={['faculty']}>
              <FacultyDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/faculty/review"
          element={
            <ProtectedRoute allowedRoles={['faculty']}>
              <FacultyReview />
            </ProtectedRoute>
          }
        />
        <Route
          path="/faculty/*"
          element={
            <ProtectedRoute allowedRoles={['faculty']}>
              <FacultyDashboard />
            </ProtectedRoute>
          }
        />

        {/* Lab Assistant routes */}
        <Route
          path="/lab"
          element={
            <ProtectedRoute allowedRoles={['lab_assistant']}>
              <LabDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/lab/users"
          element={
            <ProtectedRoute allowedRoles={['lab_assistant']}>
              <UserManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/lab/*"
          element={
            <ProtectedRoute allowedRoles={['lab_assistant']}>
              <LabDashboard />
            </ProtectedRoute>
          }
        />

        {/* Shared routes */}
        <Route
          path="/notifications"
          element={
            <ProtectedRoute>
              <NotificationsPage />
            </ProtectedRoute>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppShell>
  );
};

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <ThemeProvider>
      <AuthProvider>
        <CustomCursor />
        <ErrorBoundary>
          <AppRoutes />
        </ErrorBoundary>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: 'var(--bg-card)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-subtle)',
              fontFamily: 'var(--font-body)',
              fontSize: '0.875rem',
            },
          }}
        />
      </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
};

export default App;

