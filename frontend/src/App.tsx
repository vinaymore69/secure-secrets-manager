import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { Dashboard } from './pages/Dashboard';
import { SecretsList } from './pages/SecretsList';
import { SecretView } from './pages/SecretView';
import { SecretForm } from './pages/SecretForm';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* Protected routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/secrets"
            element={
              <ProtectedRoute>
                <SecretsList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/secrets/new"
            element={
              <ProtectedRoute>
                <SecretForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/secrets/:id"
            element={
              <ProtectedRoute>
                <SecretView />
              </ProtectedRoute>
            }
          />
          <Route
            path="/secrets/:id/edit"
            element={
              <ProtectedRoute>
                <SecretForm />
              </ProtectedRoute>
            }
          />

          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;