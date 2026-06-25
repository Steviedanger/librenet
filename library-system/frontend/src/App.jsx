import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import useAuth from './hooks/useAuth.js';
import LoadingSpinner from './components/LoadingSpinner.jsx';

import Home from './pages/Home.jsx';
import Register from './pages/Register.jsx';
import Login from './pages/Login.jsx';
import VerifyEmail from './pages/VerifyEmail.jsx';
import ForgotPassword from './pages/ForgotPassword.jsx';
import ResetPassword from './pages/ResetPassword.jsx';
import Library from './pages/Library.jsx';
import BookDetail from './pages/BookDetail.jsx';
import BookReader from './pages/BookReader.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Profile from './pages/Profile.jsx';
import AdminDashboard from './pages/admin/AdminDashboard.jsx';
import ManageBooks from './pages/admin/ManageBooks.jsx';
import ManageUsers from './pages/admin/ManageUsers.jsx';

function App() {
  const { loading } = useAuth();

  // Block the first paint until the silent refresh resolves so protected
  // routes don't flash the login page for already-authenticated users.
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-navy-900">
        <LoadingSpinner label="Loading your library…" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-navy-900">
      <Navbar />
      <main className="flex-1">
        <Routes>
          {/* Public */}
          <Route path="/" element={<Home />} />
          <Route path="/library" element={<Library />} />
          <Route path="/books/:id" element={<BookDetail />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Authenticated students */}
          <Route
            path="/read/:id"
            element={
              <ProtectedRoute>
                <BookReader />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />

          {/* Admin only */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute requireAdmin>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/books"
            element={
              <ProtectedRoute requireAdmin>
                <ManageBooks />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute requireAdmin>
                <ManageUsers />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <footer className="border-t border-cream-300/10 py-6 text-center text-sm text-cream-300/50">
        LibreNet Library · Built for readers · {new Date().getFullYear()}
      </footer>
    </div>
  );
}

export default App;
