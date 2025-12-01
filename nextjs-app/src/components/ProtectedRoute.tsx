'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Box, CircularProgress } from '@mui/material';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireLinked?: boolean;
  requireAdmin?: boolean;
}

export default function ProtectedRoute({ 
  children, 
  requireLinked = false,
  requireAdmin = false 
}: ProtectedRouteProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading, isAuthenticated, isAdmin, isLinked } = useAuth();

  useEffect(() => {
    if (loading) return;

    // Not authenticated → login
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }

    // Authenticated but not linked and not admin → pending link page
    if (!isLinked() && !isAdmin() && pathname !== '/pending-link') {
      router.push('/pending-link');
      return;
    }

    // Require admin but user is not admin → dashboard
    if (requireAdmin && !isAdmin()) {
      router.push('/dashboard');
      return;
    }

    // Require linked but user is not linked (and not admin) → pending link
    if (requireLinked && !isLinked() && !isAdmin()) {
      router.push('/pending-link');
      return;
    }
  }, [loading, isAuthenticated, isLinked, isAdmin, requireLinked, requireAdmin, pathname, router]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!isAuthenticated()) {
    return null;
  }

  // If user is not linked and not admin, only allow pending-link page
  if (!isLinked() && !isAdmin() && pathname !== '/pending-link') {
    return null;
  }

  if (requireAdmin && !isAdmin()) {
    return null;
  }

  if (requireLinked && !isLinked() && !isAdmin()) {
    return null;
  }

  return <>{children}</>;
}

