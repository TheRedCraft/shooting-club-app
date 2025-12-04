'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  Alert,
  CircularProgress,
  Typography,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  TextField
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Edit as EditIcon,
  AdminPanelSettings as AdminIcon,
  PersonRemove as RemoveAdminIcon,
  Link as LinkIcon,
  LinkOff as UnlinkIcon,
  Lock as LockIcon
} from '@mui/icons-material';
import { adminService } from '@/lib/client/api';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { validatePassword } from '@/lib/utils/passwordValidation';
import { useAuth } from '@/contexts/AuthContext';

interface User {
  id: number;
  username: string;
  email: string;
  is_admin: boolean;
  is_linked: boolean;
  shooter_id: string | null;
  shooter_name: string | null;
  created_at: string;
  is_super_admin?: boolean;
}

export default function UserManagementTab() {
  const { t } = useLanguage();
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [userToChangePassword, setUserToChangePassword] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await adminService.getLinkedUsers();
      // Get all users, not just linked ones
      setUsers(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || t.admin.userManagement.errorLoading);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleDeleteClick = (user: User) => {
    setUserToDelete(user);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!userToDelete) return;

    try {
      await adminService.deleteUser(userToDelete.id);
      setSuccess(t.admin.userManagement.deleteSuccess.replace('{username}', userToDelete.username));
      setUsers(users.filter(u => u.id !== userToDelete.id));
      setDeleteDialogOpen(false);
      setUserToDelete(null);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || t.admin.userManagement.errorDelete);
      setDeleteDialogOpen(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setUserToDelete(null);
  };

  const handlePasswordChangeClick = (user: User) => {
    setUserToChangePassword(user);
    setNewPassword('');
    setConfirmPassword('');
    setPasswordError('');
    setPasswordSuccess(false);
    setPasswordDialogOpen(true);
  };

  const handlePasswordChangeConfirm = async () => {
    if (!userToChangePassword) return;

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
      await adminService.changeUserPassword(userToChangePassword.id, newPassword);
      setPasswordSuccess(true);
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        setPasswordDialogOpen(false);
        setPasswordSuccess(false);
        setUserToChangePassword(null);
      }, 2000);
    } catch (err: any) {
      let errorMessage = err.response?.data?.message || 'Failed to change password';
      
      // Translate common error messages
      if (errorMessage.includes('Super-Administrator') || errorMessage.includes('Super-Admin')) {
        errorMessage = t.admin.userManagement.superAdminPasswordProtected;
      }
      
      setPasswordError(errorMessage);
    } finally {
      setPasswordLoading(false);
    }
  };

  const handlePasswordChangeCancel = () => {
    setPasswordDialogOpen(false);
    setUserToChangePassword(null);
    setNewPassword('');
    setConfirmPassword('');
    setPasswordError('');
    setPasswordSuccess(false);
  };

  const handleUnlink = async (user: User) => {
    if (!confirm(t.admin.userManagement.confirmUnlink.replace('{username}', user.username))) {
      return;
    }

    try {
      await adminService.unlinkUser(user.id);
      setSuccess(t.admin.userManagement.unlinkSuccess.replace('{username}', user.username));
      await loadUsers();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || t.admin.userManagement.errorUnlink);
    }
  };

  const handleToggleAdmin = async (user: User, makeAdmin: boolean) => {
    const action = makeAdmin ? t.admin.userManagement.makeAdminAction : t.admin.userManagement.removeAdminAction;
    if (!confirm(t.admin.userManagement.confirmToggleAdmin.replace('{username}', user.username).replace('{action}', action))) {
      return;
    }

    try {
      await adminService.toggleAdmin(user.id, makeAdmin);
      const status = makeAdmin ? t.admin.userManagement.isNowAdmin : t.admin.userManagement.isNoLongerAdmin;
      setSuccess(t.admin.userManagement.toggleAdminSuccess.replace('{username}', user.username).replace('{status}', status));
      await loadUsers();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || t.admin.userManagement.errorToggleAdmin);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={3}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      <Typography variant="body2" color="text.secondary" paragraph>
        {t.admin.userManagement.description}
      </Typography>

      <TableContainer component={Paper} variant="outlined">
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>{t.admin.userManagement.username}</TableCell>
              <TableCell>{t.admin.userManagement.email}</TableCell>
              <TableCell>{t.admin.userManagement.role}</TableCell>
              <TableCell>{t.admin.userManagement.linkStatus}</TableCell>
              <TableCell>{t.admin.userManagement.shooter}</TableCell>
              <TableCell>{t.admin.userManagement.registered}</TableCell>
              <TableCell align="right">{t.admin.userManagement.actions}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <Typography variant="body2" color="text.secondary">
                    {t.admin.userManagement.noUsers}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {user.username}
                      {user.is_admin && (
                        <Tooltip title={t.admin.userManagement.administrator}>
                          <AdminIcon color="primary" fontSize="small" />
                        </Tooltip>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Chip
                      label={user.is_admin ? t.admin.userManagement.admin : t.admin.userManagement.user}
                      color={user.is_admin ? 'primary' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {user.is_linked ? (
                      <Chip
                        icon={<LinkIcon />}
                        label={t.admin.userManagement.linked}
                        color="success"
                        size="small"
                      />
                    ) : (
                      <Chip
                        icon={<UnlinkIcon />}
                        label={t.admin.userManagement.notLinked}
                        color="warning"
                        size="small"
                      />
                    )}
                  </TableCell>
                  <TableCell>
                    {user.is_linked && user.shooter_name ? (
                      <Box>
                        <Typography variant="body2">{user.shooter_name}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          ID: {user.shooter_id}
                        </Typography>
                      </Box>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        -
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    {new Date(user.created_at).toLocaleDateString('de-DE')}
                  </TableCell>
                  <TableCell align="right">
                    {user.is_admin ? (
                      user.is_super_admin ? (
                        <Tooltip title="Der Super-Administrator kann nicht degradiert werden">
                          <IconButton
                            size="small"
                            disabled
                          >
                            <RemoveAdminIcon />
                          </IconButton>
                        </Tooltip>
                      ) : currentUser?.id === user.id ? (
                        <Tooltip title="Sie können sich nicht selbst degradieren">
                          <IconButton
                            size="small"
                            disabled
                          >
                            <RemoveAdminIcon />
                          </IconButton>
                        </Tooltip>
                      ) : (
                        <Tooltip title={t.admin.userManagement.removeAdmin}>
                          <IconButton
                            size="small"
                            onClick={() => handleToggleAdmin(user, false)}
                            color="warning"
                          >
                            <RemoveAdminIcon />
                          </IconButton>
                        </Tooltip>
                      )
                    ) : (
                      <Tooltip title={t.admin.userManagement.makeAdmin}>
                        <IconButton
                          size="small"
                          onClick={() => handleToggleAdmin(user, true)}
                          color="success"
                        >
                          <AdminIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                    {user.is_super_admin && currentUser?.id === user.id ? (
                      <Tooltip title="Passwort ändern">
                        <IconButton
                          size="small"
                          onClick={() => handlePasswordChangeClick(user)}
                          color="primary"
                        >
                          <LockIcon />
                        </IconButton>
                      </Tooltip>
                    ) : !user.is_super_admin ? (
                      <Tooltip title="Passwort ändern">
                        <IconButton
                          size="small"
                          onClick={() => handlePasswordChangeClick(user)}
                          color="primary"
                        >
                          <LockIcon />
                        </IconButton>
                      </Tooltip>
                    ) : (
                      <Tooltip title="Das Passwort des Super-Administrators kann nicht von anderen geändert werden">
                        <IconButton
                          size="small"
                          disabled
                        >
                          <LockIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                    {user.is_linked && (
                      <>
                    {user.is_super_admin && currentUser?.id !== user.id ? (
                      <Tooltip title="Der Super-Administrator kann nicht von anderen getrennt werden">
                        <IconButton
                          size="small"
                          disabled
                        >
                          <UnlinkIcon />
                        </IconButton>
                      </Tooltip>
                    ) : (
                          <Tooltip title={t.admin.userManagement.unlink}>
                            <IconButton
                              size="small"
                              onClick={() => handleUnlink(user)}
                              color="info"
                            >
                              <UnlinkIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                      </>
                    )}
                    {user.is_super_admin && currentUser?.id !== user.id ? (
                      <Tooltip title="Der Super-Administrator kann nicht von anderen gelöscht werden">
                        <IconButton
                          size="small"
                          disabled
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    ) : currentUser?.id === user.id ? (
                      <Tooltip title="Sie können sich nicht selbst löschen">
                        <IconButton
                          size="small"
                          disabled
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    ) : (
                      <Tooltip title={t.admin.userManagement.delete}>
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteClick(user)}
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={handleDeleteCancel}>
        <DialogTitle>{t.admin.userManagement.delete}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {t.admin.userManagement.confirmDeleteDialog.replace('{username}', userToDelete?.username || '')}
            {userToDelete?.is_linked && (
              <>
                <br />
                <br />
                <strong>{t.admin.userManagement.confirmDeleteLinked}</strong>
              </>
            )}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel} color="primary">
            {t.common.cancel}
          </Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            {t.admin.userManagement.delete}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Password Change Dialog */}
      <Dialog open={passwordDialogOpen} onClose={handlePasswordChangeCancel} maxWidth="sm" fullWidth>
        <DialogTitle>
          Passwort ändern für {userToChangePassword?.username}
        </DialogTitle>
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
          <Button onClick={handlePasswordChangeCancel} disabled={passwordLoading}>
            {t.common.cancel}
          </Button>
          <Button onClick={handlePasswordChangeConfirm} variant="contained" disabled={passwordLoading || passwordSuccess}>
            {passwordLoading ? 'Wird geändert...' : 'Passwort ändern'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

