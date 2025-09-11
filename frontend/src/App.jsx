// src/App.jsx
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { authService } from './services/authService';
import SimpleLogin from './components/SimpleLogin';
import SimpleRegister from './components/SimpleRegister';
import Dashboard from './components/Dashboard';

function App() {
  const [user, setUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is already logged in when app starts
  useEffect(() => {
    if (authService.isLoggedIn()) {
      const currentUser = authService.getCurrentUser();
      setUser(currentUser);
      setIsLoggedIn(true);
    }
    setIsLoading(false);
  }, []);

  // Login function
  const handleLogin = async (email, password) => {
    try {
      const userData = await authService.login(email, password);
      setUser(userData);
      setIsLoggedIn(true);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  // Register function
  const handleRegister = async (firstName, lastName, email, username, password, role) => {
    try {
      const userData = await authService.register(firstName, lastName, email, username, password, role);
      setUser(userData);
      setIsLoggedIn(true);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  // Logout function
  const handleLogout = async () => {
    await authService.logout();
    setUser(null);
    setIsLoggedIn(false);
  };

  // Show loading while checking auth status
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        {/* If not logged in, show login/register */}
        {!isLoggedIn ? (
          <>
            <Route 
              path="/login" 
              element={<SimpleLogin onLogin={handleLogin} />} 
            />
            <Route 
              path="/register" 
              element={<SimpleRegister onRegister={handleRegister} />} 
            />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </>
        ) : (
          <>
            {/* If logged in, show dashboard */}
            <Route 
              path="/" 
              element={<Dashboard user={user} onLogout={handleLogout} />} 
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </>
        )}
      </Routes>
    </Router>
  );
}

export default App;