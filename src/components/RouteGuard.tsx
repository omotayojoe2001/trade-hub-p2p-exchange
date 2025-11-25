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

  // CRITICAL PAYMENT ROUTES - NEVER REDIRECT THESE
  const criticalPaymentRoutes = React.useMemo(() => [
    '/credits-purchase',
    '/credits/purchase', 
    '/buy-crypto',
    '/sell-crypto',
    '/escrow-flow',
    '/trade-details',
    '/payment',
    '/buy-crypto-payment',
    '/sell-crypto-payment',
    '/upload-payment-proof'
  ], []);

  const isPublicRoute = React.useMemo(() => 
    publicRoutes.includes(location.pathname), 
    [publicRoutes, location.pathname]
  );

  const isCriticalPaymentRoute = React.useMemo(() => 
    criticalPaymentRoutes.some(route => location.pathname.includes(route)), 
    [criticalPaymentRoutes, location.pathname]
  );

  React.useEffect(() => {
    // NEVER redirect from critical payment routes - preserve user sessions
    if (isCriticalPaymentRoute) {
      console.log('🔒 RouteGuard: Protecting critical payment route:', location.pathname);
      return;
    }

    // Prevent multiple redirects
    if (hasRedirected || loading) return;
    
    // Handle page reload authentication
    if (!user && !isPublicRoute) {
      sessionStorage.setItem('redirectPath', location.pathname);
      setHasRedirected(true);
      navigate('/auth', { replace: true });
    }
  }, [user, loading, isPublicRoute, isCriticalPaymentRoute, navigate, hasRedirected, location.pathname]);

  // Reset redirect flag when user changes or route changes to public
  React.useEffect(() => {
    if (user || isPublicRoute || isCriticalPaymentRoute) {
      setHasRedirected(false);
    }
  }, [user, isPublicRoute, isCriticalPaymentRoute]);

  // Show loader during auth check (but not on critical payment routes)
  if (loading && !isCriticalPaymentRoute) {
    return <GlobalLoader />;
  }

  // Show loader while redirecting (but not on critical payment routes)
  if (!user && !isPublicRoute && !isCriticalPaymentRoute && hasRedirected) {
    return <GlobalLoader />;
  }

  return <>{children}</>;
};

export default RouteGuard;