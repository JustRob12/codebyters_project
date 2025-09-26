'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  allowedRoles?: number[];
  redirectTo?: string;
}

export default function AuthGuard({ 
  children, 
  requireAuth = true, 
  allowedRoles = [], 
  redirectTo = '/login' 
}: AuthGuardProps) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [hasRedirected, setHasRedirected] = useState(false);

  useEffect(() => {
    if (isLoading || hasRedirected) return;

    // If authentication is required but user is not authenticated
    if (requireAuth && !isAuthenticated) {
      setHasRedirected(true);
      router.push(redirectTo);
      return;
    }

    // If user is authenticated but doesn't have required role
    if (isAuthenticated && allowedRoles.length > 0 && user) {
      if (!allowedRoles.includes(user.role)) {
        setHasRedirected(true);
        // Redirect based on user role
        if (user.role === 0) {
          router.push('/admin');
        } else if (user.role === 1) {
          router.push('/instructor');
        } else {
          router.push('/dashboard');
        }
        return;
      }
    }
  }, [isAuthenticated, isLoading, user, requireAuth, allowedRoles, redirectTo, router, hasRedirected]);

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#20B2AA] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If authentication is required but user is not authenticated, don't render children
  if (requireAuth && !isAuthenticated) {
    return null;
  }

  // If user doesn't have required role, don't render children
  if (isAuthenticated && allowedRoles.length > 0 && user && !allowedRoles.includes(user.role)) {
    return null;
  }

  return <>{children}</>;
}
