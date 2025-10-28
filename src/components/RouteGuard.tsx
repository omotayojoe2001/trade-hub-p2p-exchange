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
  const [hasRedirected, setHasRedirected] = React.useState(false);

  // Public routes that don't require authentication
  const publicRoutes = React.useMemo(() => [
    '/auth',
    '/splash',
    '/onboarding',
    '/email-verification',
    '/forgot-password',
    '/reset-password',
    '/verify-email',
    '/vendor/login',
    '/account-deletion-instructions',
    '/'
  ], []);

  const isPublicRoute = React.useMemo(() => 
    publicRoutes.includes(location.pathname), 
    [publicRoutes, location.pathname]
  );

  React.useEffect(() => {
    // Prevent multiple redirects
    if (hasRedirected || loading) return;
    
    // Handle page reload authentication
    if (!user && !isPublicRoute) {
      sessionStorage.setItem('redirectPath', location.pathname);
      setHasRedirected(true);
      navigate('/auth', { replace: true });
    }
  }, [user, loading, isPublicRoute, navigate, hasRedirected, location.pathname]);

  // Reset redirect flag when user changes or route changes to public
  React.useEffect(() => {
    if (user || isPublicRoute) {
      setHasRedirected(false);
    }
  }, [user, isPublicRoute]);

  // Show loader during auth check
  if (loading) {
    return <GlobalLoader />;
  }

  // Show loader while redirecting
  if (!user && !isPublicRoute && hasRedirected) {
    return <GlobalLoader />;
  }

  return <>{children}</>;
};

export default RouteGuard;