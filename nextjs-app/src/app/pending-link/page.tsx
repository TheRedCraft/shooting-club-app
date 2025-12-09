'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Container,
  Card,
  CardContent,
  Typography,
  Alert
} from '@mui/material';
import { HourglassEmpty } from '@mui/icons-material';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { profileService } from '@/lib/client/api';
import LanguageSwitcher from '@/components/LanguageSwitcher';

export default function PendingLinkPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const { updateUser } = useAuth();
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    // Check user status periodically
    const checkUserStatus = async () => {
      try {
        const response = await profileService.getProfile();
        const userData = response.data.user;
        
        // If user is now linked, update context and redirect
        if (userData.is_linked || userData.is_admin) {
          updateUser({
            id: userData.id,
            username: userData.username,
            email: userData.email,
            is_admin: userData.is_admin,
            is_linked: userData.is_linked,
            shooter_id: userData.shooter_id
          });
          
          // Stop polling
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
          }
          
          // Redirect to dashboard
          router.push('/dashboard');
        }
      } catch (error) {
        // Silently fail - user might not be authenticated anymore
        console.error('Error checking user status:', error);
      }
    };

    // Check immediately
    checkUserStatus();

    // Then check every 3 seconds
    pollingIntervalRef.current = setInterval(checkUserStatus, 3000);

    // Cleanup on unmount
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [router, updateUser]);

  return (
    <Container maxWidth="md">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <Card sx={{ width: '100%' }}>
          <CardContent sx={{ p: 4, textAlign: 'center' }}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
              <LanguageSwitcher />
            </Box>
            
            <HourglassEmpty sx={{ fontSize: 80, color: 'primary.main', mb: 3 }} />
            
            <Typography variant="h4" gutterBottom>
              {t.pendingLink.title}
            </Typography>
            
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              {t.pendingLink.subtitle}
            </Typography>
            
            <Alert severity="info" sx={{ textAlign: 'left' }}>
              <Typography variant="subtitle2" gutterBottom>
                {t.pendingLink.nextSteps}
              </Typography>
              <Typography variant="body2">
                1. {t.pendingLink.step1}
                <br />
                2. {t.pendingLink.step2}
                <br />
                3. {t.pendingLink.step3}
              </Typography>
            </Alert>
            
            <Typography variant="body2" color="text.secondary" sx={{ mt: 3 }}>
              {t.pendingLink.timeframe}
            </Typography>
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
}

