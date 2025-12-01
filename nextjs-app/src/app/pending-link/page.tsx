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

export default function PendingLinkPage() {
  const router = useRouter();

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
            <HourglassEmpty sx={{ fontSize: 80, color: 'primary.main', mb: 3 }} />
            
            <Typography variant="h4" gutterBottom>
              Account Pending Verification
            </Typography>
            
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              Your account has been created successfully!
            </Typography>
            
            <Alert severity="info" sx={{ textAlign: 'left' }}>
              <Typography variant="subtitle2" gutterBottom>
                Next Steps:
              </Typography>
              <Typography variant="body2">
                1. An administrator needs to link your account to a Meyton shooter profile
                <br />
                2. You will receive access to your dashboard once linked
                <br />
                3. Please contact your club administrator to complete the setup
              </Typography>
            </Alert>
            
            <Typography variant="body2" color="text.secondary" sx={{ mt: 3 }}>
              This usually takes 1-2 business days
            </Typography>
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
}

