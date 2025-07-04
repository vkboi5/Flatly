import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';

// Components
import LoadingScreen from './components/LoadingScreen';
import Navbar from './components/Navbar';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Register from './pages/Register';
import Onboarding from './pages/Onboarding';
import SelfQuestionnaire from './pages/SelfQuestionnaire';
import DesiredQuestionnaire from './pages/DesiredQuestionnaire';
import ProfileCreation from './pages/ProfileCreation';
import SwipeFeed from './pages/SwipeFeed';
import Matches from './pages/Matches';
import Profile from './pages/Profile';
import Settings from './pages/Settings';

// Protected Route component
const ProtectedRoute = ({ children }) => {
    const { isAuthenticated, loading } = useAuth();
    
    if (loading) {
        return <LoadingScreen />;
    }
    
    return isAuthenticated ? children : <Navigate to="/login" />;
};

// Public Route component (redirect to app if authenticated)
const PublicRoute = ({ children }) => {
    const { isAuthenticated, loading } = useAuth();
    
    if (loading) {
        return <LoadingScreen />;
    }
    
    return !isAuthenticated ? children : <Navigate to="/app" />;
};

// App Routes component
const AppRoutes = () => {
    const { user } = useAuth();
    
    return (
        <Routes>
            {/* Landing Page */}
            <Route path="/" element={<LandingPage />} />
            
            {/* Public Routes */}
            <Route path="/login" element={
                <PublicRoute>
                    <Login />
                </PublicRoute>
            } />
            <Route path="/register" element={
                <PublicRoute>
                    <Register />
                </PublicRoute>
            } />
            
            {/* Protected Routes */}
            <Route path="/app" element={
                <ProtectedRoute>
                    <>
                        <Navbar />
                        {!user?.isProfileComplete ? (
                            <Navigate to="/onboarding" />
                        ) : (
                            <SwipeFeed />
                        )}
                    </>
                </ProtectedRoute>
            } />
            
            <Route path="/onboarding" element={
                <ProtectedRoute>
                    <Onboarding />
                </ProtectedRoute>
            } />
            
            <Route path="/questionnaire/self" element={
                <ProtectedRoute>
                    <SelfQuestionnaire />
                </ProtectedRoute>
            } />
            
            <Route path="/questionnaire/desired" element={
                <ProtectedRoute>
                    <DesiredQuestionnaire />
                </ProtectedRoute>
            } />
            
            <Route path="/profile-creation" element={
                <ProtectedRoute>
                    <ProfileCreation />
                </ProtectedRoute>
            } />
            
            <Route path="/matches" element={
                <ProtectedRoute>
                    <>
                        <Navbar />
                        <Matches />
                    </>
                </ProtectedRoute>
            } />
            
            <Route path="/profile" element={
                <ProtectedRoute>
                    <>
                        <Navbar />
                        <Profile />
                    </>
                </ProtectedRoute>
            } />
            
            <Route path="/settings" element={
                <ProtectedRoute>
                    <>
                        <Navbar />
                        <Settings />
                    </>
                </ProtectedRoute>
            } />
            
            {/* Default redirects */}
            <Route path="*" element={<Navigate to="/" />} />
        </Routes>
    );
};

// Main App component
const App = () => {
    return (
        <AuthProvider>
            <Router>
                <div className="min-h-screen w-full bg-gray-50">
                    <AppRoutes />
                    <Toaster 
                        position="top-right"
                        toastOptions={{
                            duration: 4000,
                            style: {
                                background: '#363636',
                                color: '#fff',
                            },
                        }}
                    />
                </div>
            </Router>
        </AuthProvider>
    );
};

export default App;
