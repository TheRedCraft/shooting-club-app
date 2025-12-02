'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Container,
  Paper,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Grid,
  Divider,
  Chip,
  Avatar,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField
} from '@mui/material';
import {
  Person as PersonIcon,
  Email as EmailIcon,
  AdminPanelSettings as AdminIcon,
  Link as LinkIcon,
  SportsMartialArts as ShooterIcon,
  CalendarToday as CalendarIcon,
  Lock as LockIcon
} from '@mui/icons-material';
import { useAuth } from '@/contexts/AuthContext';
import { profileService } from '@/lib/client/api';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { validatePassword } from '@/lib/utils/passwordValidation';

interface ProfileData {
  id: number;
  username: string;
  email: string;
  is_admin: boolean;
  is_linked: boolean;
  shooter_id: string | null;
  shooter_name: string | null;
  created_at: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { t } = useLanguage();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }

    const loadProfile = async () => {
      try {
        setLoading(true);
        const response = await profileService.getProfile();
        setProfile(response.data);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Fehler beim Laden des Profils');
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [authLoading, isAuthenticated, router]);

  const handlePasswordChange = async () => {
    setPasswordError('');
    setPasswordSuccess(false);

    // Validate passwords match
    if (newPassword !== confirmPassword) {
      setPasswordError(t.register.passwordMismatch);
      return;
    }

    // Validate password policy
    const validation = validatePassword(newPassword);
    if (!validation.isValid) {
      const firstError = validation.errors[0];
      setPasswordError(t.register[firstError as keyof typeof t.register] as string || 'Password does not meet requirements');
      return;
    }

    setPasswordLoading(true);
    try {
      await profileService.changePassword(currentPassword, newPassword);
      setPasswordSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        setPasswordDialogOpen(false);
        setPasswordSuccess(false);
      }, 2000);
    } catch (err: any) {
      setPasswordError(err.response?.data?.message || 'Failed to change password');
    } finally {
      setPasswordLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!isAuthenticated()) {
    return null;
  }

  if (!profile) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="error">Profil konnte nicht geladen werden</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <Avatar
            sx={{
              width: 80,
              height: 80,
              bgcolor: 'primary.main',
              fontSize: '2rem'
            }}
          >
            {profile.username.charAt(0).toUpperCase()}
          </Avatar>
          <Box>
            <Typography variant="h4" gutterBottom>
              {profile.username}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              {profile.is_admin && (
                <Chip
                  icon={<AdminIcon />}
                  label="Administrator"
                  color="primary"
                  size="small"
                />
              )}
              {profile.is_linked ? (
                <Chip
                  icon={<LinkIcon />}
                  label="Verknüpft"
                  color="success"
                  size="small"
                />
              ) : (
                <Chip
                  icon={<LinkIcon />}
                  label="Nicht verknüpft"
                  color="warning"
                  size="small"
                />
              )}
            </Box>
          </Box>
        </Box>

        <Divider sx={{ my: 3 }} />

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Grid container spacing={3}>
          <Grid size={{ xs: 12 }}>
            <Typography variant="h6" gutterBottom>
              Persönliche Informationen
            </Typography>
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <PersonIcon color="action" />
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Benutzername
                </Typography>
                <Typography variant="body1">{profile.username}</Typography>
              </Box>
            </Box>
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <EmailIcon color="action" />
              <Box>
                <Typography variant="caption" color="text.secondary">
                  E-Mail
                </Typography>
                <Typography variant="body1">{profile.email}</Typography>
              </Box>
            </Box>
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <CalendarIcon color="action" />
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Mitglied seit
                </Typography>
                <Typography variant="body1">
                  {new Date(profile.created_at).toLocaleDateString('de-DE', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </Typography>
              </Box>
            </Box>
          </Grid>

          {profile.is_linked && profile.shooter_name && (
            <>
              <Grid size={{ xs: 12 }}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Meyton Verknüpfung
                </Typography>
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <ShooterIcon color="action" />
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Schützen-Name
                    </Typography>
                    <Typography variant="body1">{profile.shooter_name}</Typography>
                  </Box>
                </Box>
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <LinkIcon color="action" />
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Schützen-ID
                    </Typography>
                    <Typography variant="body1">{profile.shooter_id}</Typography>
                  </Box>
                </Box>
              </Grid>
            </>
          )}

          {!profile.is_linked && (
            <Grid size={{ xs: 12 }}>
              <Alert severity="info">
                Ihr Account ist noch keinem Schützen zugeordnet. Bitte kontaktieren Sie
                einen Administrator, um Ihre Statistiken zu aktivieren.
              </Alert>
            </Grid>
          )}

          <Grid size={{ xs: 12 }}>
            <Divider sx={{ my: 2 }} />
            <Button
              variant="outlined"
              startIcon={<LockIcon />}
              onClick={() => setPasswordDialogOpen(true)}
            >
              Passwort ändern
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Password Change Dialog */}
      <Dialog open={passwordDialogOpen} onClose={() => !passwordLoading && setPasswordDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Passwort ändern</DialogTitle>
        <DialogContent>
          {passwordSuccess && (
            <Alert severity="success" sx={{ mb: 2 }}>
              Passwort erfolgreich geändert!
            </Alert>
          )}
          {passwordError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {passwordError}
            </Alert>
          )}
          <TextField
            fullWidth
            label="Aktuelles Passwort"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            margin="normal"
            required
            disabled={passwordLoading || passwordSuccess}
          />
          <TextField
            fullWidth
            label="Neues Passwort"
            type="password"
            value={newPassword}
            onChange={(e) => {
              setNewPassword(e.target.value);
              setPasswordError('');
            }}
            margin="normal"
            required
            disabled={passwordLoading || passwordSuccess}
            error={passwordError.includes('password') && !passwordError.includes('Current')}
          />
          <TextField
            fullWidth
            label="Neues Passwort bestätigen"
            type="password"
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              setPasswordError('');
            }}
            margin="normal"
            required
            disabled={passwordLoading || passwordSuccess}
            error={confirmPassword !== '' && newPassword !== confirmPassword}
            helperText={
              confirmPassword !== '' && newPassword !== confirmPassword
                ? t.register.passwordMismatch
                : ''
            }
          />
          <Box sx={{ mt: 2, p: 1.5, bgcolor: 'grey.50', borderRadius: 1 }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold', display: 'block', mb: 0.5 }}>
              {t.register.passwordRequirements}
            </Typography>
            <Typography variant="caption" color={newPassword.length >= 8 ? 'success.main' : 'text.secondary'} sx={{ display: 'block' }}>
              ✓ {t.register.passwordRequirementLength}
            </Typography>
            <Typography variant="caption" color={/[A-Z]/.test(newPassword) ? 'success.main' : 'text.secondary'} sx={{ display: 'block' }}>
              ✓ {t.register.passwordRequirementUppercase}
            </Typography>
            <Typography variant="caption" color={/[a-z]/.test(newPassword) ? 'success.main' : 'text.secondary'} sx={{ display: 'block' }}>
              ✓ {t.register.passwordRequirementLowercase}
            </Typography>
            <Typography variant="caption" color={/[0-9]/.test(newPassword) ? 'success.main' : 'text.secondary'} sx={{ display: 'block' }}>
              ✓ {t.register.passwordRequirementNumber}
            </Typography>
            <Typography variant="caption" color={/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword) ? 'success.main' : 'text.secondary'} sx={{ display: 'block' }}>
              ✓ {t.register.passwordRequirementSpecialChar}
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPasswordDialogOpen(false)} disabled={passwordLoading}>
            Abbrechen
          </Button>
          <Button onClick={handlePasswordChange} variant="contained" disabled={passwordLoading || passwordSuccess}>
            {passwordLoading ? 'Wird geändert...' : 'Passwort ändern'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

