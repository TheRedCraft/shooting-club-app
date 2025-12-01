'use client';

import { useEffect } from 'react';
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
import LanguageSwitcher from '@/components/LanguageSwitcher';

export default function PendingLinkPage() {
  const router = useRouter();
  const { t } = useLanguage();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
    }
  }, [router]);

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

