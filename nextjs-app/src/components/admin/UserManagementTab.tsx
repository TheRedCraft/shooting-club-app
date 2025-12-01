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
  LinkOff as UnlinkIcon
} from '@mui/icons-material';
import { adminService } from '@/lib/client/api';
import { useLanguage } from '@/lib/i18n/LanguageContext';

interface User {
  id: number;
  username: string;
  email: string;
  is_admin: boolean;
  is_linked: boolean;
  shooter_id: string | null;
  shooter_name: string | null;
  created_at: string;
}

export default function UserManagementTab() {
  const { t } = useLanguage();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

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
                      <Tooltip title={t.admin.userManagement.removeAdmin}>
                        <IconButton
                          size="small"
                          onClick={() => handleToggleAdmin(user, false)}
                          color="warning"
                        >
                          <RemoveAdminIcon />
                        </IconButton>
                      </Tooltip>
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
                    {user.is_linked && (
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
                    <Tooltip title={t.admin.userManagement.delete}>
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteClick(user)}
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
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
    </Box>
  );
}

