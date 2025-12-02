'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Box,
  Menu,
  MenuItem,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  useMediaQuery,
  useTheme,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  AdminPanelSettings as AdminIcon,
  Leaderboard as LeaderboardIcon,
  AccountCircle as AccountIcon,
  Logout as LogoutIcon,
  Timeline as TimelineIcon,
  Lock as LockIcon
} from '@mui/icons-material';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { profileService } from '@/lib/client/api';
import { validatePassword } from '@/lib/utils/passwordValidation';
import LanguageSwitcher from './LanguageSwitcher';
import ClubLogo from './ClubLogo';

export default function Navigation() {
  const router = useRouter();
  const pathname = usePathname();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user, logout, isAuthenticated, isAdmin } = useAuth();
  const { t } = useLanguage();
  
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  // Don't show navigation on login/register pages
  if (pathname === '/login' || pathname === '/register') {
    return null;
  }

  if (!isAuthenticated()) {
    return null;
  }

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    handleProfileMenuClose();
    router.push('/login');
  };

  const handlePasswordChangeClick = () => {
    setPasswordDialogOpen(true);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setPasswordError('');
    setPasswordSuccess(false);
    handleProfileMenuClose();
  };

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
      console.error('Password change error:', err);
      let errorMessage = err.response?.data?.message || err.message || 'Failed to change password';
      
      // Translate common error messages
      if (errorMessage.includes('Current password is incorrect') || errorMessage.includes('incorrect')) {
        errorMessage = t.register.currentPasswordIncorrect;
      }
      
      setPasswordError(errorMessage);
      // Clear password fields on error (except current password for retry)
      setNewPassword('');
      setConfirmPassword('');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handlePasswordDialogClose = () => {
    if (!passwordLoading) {
      setPasswordDialogOpen(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordError('');
      setPasswordSuccess(false);
    }
  };

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const navigationItems = [
    { label: t.nav.dashboard, icon: <DashboardIcon />, path: '/dashboard' },
    { label: t.nav.leaderboard, icon: <LeaderboardIcon />, path: '/leaderboard' },
    ...(isAdmin() ? [{ label: t.nav.admin, icon: <AdminIcon />, path: '/admin' }] : [])
  ];

  const drawer = (
    <Box onClick={handleDrawerToggle} sx={{ textAlign: 'center' }}>
      <Box sx={{ my: 2, display: 'flex', justifyContent: 'center' }}>
        <ClubLogo variant="h6" />
      </Box>
      <Divider />
      <List>
        {navigationItems.map((item) => (
          <ListItem key={item.path} disablePadding>
            <ListItemButton
              selected={pathname === item.path}
              onClick={() => router.push(item.path)}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <>
      <AppBar position="sticky">
        <Toolbar>
          {isMobile && (
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
          )}
          
          <Box sx={{ flexGrow: 0, mr: 4 }}>
            <ClubLogo variant="h6" />
          </Box>

          {!isMobile && (
            <Box sx={{ flexGrow: 1, display: 'flex', gap: 1 }}>
              {navigationItems.map((item) => (
                <Button
                  key={item.path}
                  color="inherit"
                  startIcon={item.icon}
                  onClick={() => router.push(item.path)}
                  sx={{
                    borderBottom: pathname === item.path ? 2 : 0,
                    borderRadius: 0
                  }}
                >
                  {item.label}
                </Button>
              ))}
            </Box>
          )}

          <Box sx={{ flexGrow: 1 }} />

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {!isMobile && user && (
              <Typography variant="body2">
                {user.username}
                {user.is_admin && ' (Admin)'}
              </Typography>
            )}
            <LanguageSwitcher />
            <IconButton
              size="large"
              aria-label="account menu"
              aria-controls="menu-appbar"
              aria-haspopup="true"
              onClick={handleProfileMenuOpen}
              color="inherit"
            >
              <AccountIcon />
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Mobile Drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true // Better open performance on mobile
        }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: 240 }
        }}
      >
        {drawer}
      </Drawer>

      {/* Profile Menu */}
      <Menu
        id="menu-appbar"
        anchorEl={anchorEl}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'right'
        }}
        keepMounted
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right'
        }}
        open={Boolean(anchorEl)}
        onClose={handleProfileMenuClose}
      >
        <MenuItem onClick={handlePasswordChangeClick}>
          <ListItemIcon>
            <LockIcon fontSize="small" />
          </ListItemIcon>
          Passwort ändern
        </MenuItem>
        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          {t.nav.logout}
        </MenuItem>
      </Menu>

      {/* Password Change Dialog */}
      <Dialog open={passwordDialogOpen} onClose={handlePasswordDialogClose} maxWidth="sm" fullWidth>
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
            autoFocus
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
          <Button onClick={handlePasswordDialogClose} disabled={passwordLoading}>
            Abbrechen
          </Button>
          <Button onClick={handlePasswordChange} variant="contained" disabled={passwordLoading || passwordSuccess}>
            {passwordLoading ? 'Wird geändert...' : 'Passwort ändern'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

