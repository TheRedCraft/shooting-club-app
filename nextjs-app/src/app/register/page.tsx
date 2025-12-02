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
import { useLanguage } from '@/lib/i18n/LanguageContext';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import ClubLogo from '@/components/ClubLogo';
import { validatePassword } from '@/lib/utils/passwordValidation';

export default function RegisterPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setPasswordErrors([]);

    // Validate password match
    if (password !== confirmPassword) {
      setError(t.register.passwordMismatch);
      return;
    }

    // SECURITY: Validate password policy
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      setPasswordErrors(passwordValidation.errors);
      // Show first error as main error
      const firstErrorKey = passwordValidation.errors[0];
      setError(t.register[firstErrorKey as keyof typeof t.register] as string || 'Password does not meet requirements');
      return;
    }

    setLoading(true);

    try {
      const response = await authService.register(username, email, password);
      const { token, user } = response.data;

      // Store token and user data
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      // Redirect to pending link page
      router.push('/pending-link');
    } catch (err: any) {
      const errorMessage = err.response?.data?.message;
      // Check if backend returned password validation errors
      if (err.response?.data?.errors && Array.isArray(err.response.data.errors)) {
        setPasswordErrors(err.response.data.errors);
        const firstErrorKey = err.response.data.errors[0];
        setError(t.register[firstErrorKey as keyof typeof t.register] as string || errorMessage || 'Registration failed');
      } else {
        setError(errorMessage || 'Registration failed');
      }
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
              {t.register.title}
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <form onSubmit={handleSubmit}>
              <TextField
                fullWidth
                label={t.register.username}
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                margin="normal"
                required
                autoFocus
              />
              <TextField
                fullWidth
                label={t.register.email}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                margin="normal"
                required
              />
              <TextField
                fullWidth
                label={t.register.password}
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  // Validate on change
                  const validation = validatePassword(e.target.value);
                  setPasswordErrors(validation.errors);
                }}
                margin="normal"
                required
                error={passwordErrors.length > 0}
                helperText={
                  passwordErrors.length > 0 
                    ? passwordErrors.map(err => t.register[err as keyof typeof t.register]).join(', ')
                    : ''
                }
              />
              <Box sx={{ mb: 2, p: 1.5, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold', display: 'block', mb: 0.5 }}>
                  {t.register.passwordRequirements}
                </Typography>
                <Typography variant="caption" color={password.length >= 8 ? 'success.main' : 'text.secondary'} sx={{ display: 'block' }}>
                  ✓ {t.register.passwordRequirementLength}
                </Typography>
                <Typography variant="caption" color={/[A-Z]/.test(password) ? 'success.main' : 'text.secondary'} sx={{ display: 'block' }}>
                  ✓ {t.register.passwordRequirementUppercase}
                </Typography>
                <Typography variant="caption" color={/[a-z]/.test(password) ? 'success.main' : 'text.secondary'} sx={{ display: 'block' }}>
                  ✓ {t.register.passwordRequirementLowercase}
                </Typography>
                <Typography variant="caption" color={/[0-9]/.test(password) ? 'success.main' : 'text.secondary'} sx={{ display: 'block' }}>
                  ✓ {t.register.passwordRequirementNumber}
                </Typography>
                <Typography variant="caption" color={/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password) ? 'success.main' : 'text.secondary'} sx={{ display: 'block' }}>
                  ✓ {t.register.passwordRequirementSpecialChar}
                </Typography>
              </Box>
              <TextField
                fullWidth
                label={t.register.confirmPassword}
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                margin="normal"
                required
                error={confirmPassword !== '' && password !== confirmPassword}
                helperText={
                  confirmPassword !== '' && password !== confirmPassword
                    ? t.register.passwordMismatch
                    : ''
                }
              />
              <Button
                fullWidth
                type="submit"
                variant="contained"
                size="large"
                disabled={loading}
                sx={{ mt: 3, mb: 2 }}
              >
                {loading ? `${t.common.loading}...` : t.register.registerButton}
              </Button>
              <Button
                fullWidth
                variant="text"
                onClick={() => router.push('/login')}
              >
                {t.register.haveAccount} {t.register.loginButton}
              </Button>
            </form>
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
}

