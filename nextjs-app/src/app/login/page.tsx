'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  Container
} from '@mui/material';
import { authService } from '@/lib/client/api';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import ClubLogo from '@/components/ClubLogo';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authService.login(email, password);
      const { token, user } = response.data;

      // Store via AuthContext
      login(token, user);

      // Redirect based on user status
      if (user.is_linked || user.is_admin) {
        router.push('/dashboard');
      } else {
        router.push('/pending-link');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <Card sx={{ width: '100%' }}>
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
              <LanguageSwitcher />
            </Box>
            
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
              <ClubLogo variant="h4" />
            </Box>
            <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>
              {t.login.title}
            </Typography>

            {error && (
              <Alert 
                severity="error" 
                sx={{ mb: 2 }}
                onClose={() => setError('')}
              >
                {error}
              </Alert>
            )}

            <form onSubmit={handleSubmit}>
              <TextField
                fullWidth
                label={t.login.username}
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                margin="normal"
                required
                autoFocus
              />
              <TextField
                fullWidth
                label={t.login.password}
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                margin="normal"
                required
              />
              <Button
                fullWidth
                type="submit"
                variant="contained"
                size="large"
                disabled={loading}
                sx={{ mt: 3, mb: 2 }}
              >
                {loading ? `${t.common.loading}...` : t.login.loginButton}
              </Button>
              <Button
                fullWidth
                variant="text"
                onClick={() => router.push('/register')}
              >
                {t.login.noAccount} {t.login.registerButton}
              </Button>
            </form>
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
}

