import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate, useLocation } from 'react-router-dom';
import GlobalLoader from './GlobalLoader';

interface RouteGuardProps {
  children: React.ReactNode;
}

const RouteGuard: React.FC<RouteGuardProps> = ({ children }) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Public routes that don't require authentication
  const publicRoutes = [
    '/auth',
    '/splash',
    '/onboarding',
    '/email-verification',
    '/forgot-password',
    '/reset-password',
    '/verify-email',
    '/vendor/login',
    '/account-deletion-instructions'
  ];

  const isPublicRoute = publicRoutes.includes(location.pathname);

  React.useEffect(() => {
    // Handle page reload authentication
    if (!loading && !user && !isPublicRoute) {
      // Store current path for redirect after login
      sessionStorage.setItem('redirectPath', location.pathname);
      navigate('/auth', { replace: true });
    }
  }, [user, loading, isPublicRoute, navigate]);

  // Show loader during auth check
  if (loading) {
    return <GlobalLoader />;
  }

  // Redirect to auth if not authenticated and not on public route
  if (!user && !isPublicRoute) {
    return <GlobalLoader />;
  }

  return <>{children}</>;
};

export default RouteGuard;