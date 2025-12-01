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
      setError(err.response?.data?.message || 'Fehler beim Laden der Benutzer');
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
      setSuccess(`Benutzer "${userToDelete.username}" wurde gelöscht`);
      setUsers(users.filter(u => u.id !== userToDelete.id));
      setDeleteDialogOpen(false);
      setUserToDelete(null);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Fehler beim Löschen des Benutzers');
      setDeleteDialogOpen(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setUserToDelete(null);
  };

  const handleUnlink = async (user: User) => {
    if (!confirm(`Möchten Sie die Verknüpfung von "${user.username}" wirklich aufheben?`)) {
      return;
    }

    try {
      await adminService.unlinkUser(user.id);
      setSuccess(`Verknüpfung von ${user.username} wurde aufgehoben`);
      await loadUsers();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Fehler beim Trennen der Verknüpfung');
    }
  };

  const handleToggleAdmin = async (user: User, makeAdmin: boolean) => {
    const action = makeAdmin ? 'zum Admin machen' : 'Admin-Rechte entziehen';
    if (!confirm(`Möchten Sie "${user.username}" wirklich ${action}?`)) {
      return;
    }

    try {
      await adminService.toggleAdmin(user.id, makeAdmin);
      setSuccess(`${user.username} ${makeAdmin ? 'ist jetzt Admin' : 'ist kein Admin mehr'}`);
      await loadUsers();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Fehler beim Ändern der Admin-Rechte');
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
        Übersicht aller Benutzer mit Admin-Rechten und Verknüpfungsstatus.
      </Typography>

      <TableContainer component={Paper} variant="outlined">
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Benutzername</TableCell>
              <TableCell>E-Mail</TableCell>
              <TableCell>Rolle</TableCell>
              <TableCell>Verknüpfung</TableCell>
              <TableCell>Schütze</TableCell>
              <TableCell>Registriert</TableCell>
              <TableCell align="right">Aktionen</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <Typography variant="body2" color="text.secondary">
                    Keine Benutzer gefunden
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
                        <Tooltip title="Administrator">
                          <AdminIcon color="primary" fontSize="small" />
                        </Tooltip>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Chip
                      label={user.is_admin ? 'Admin' : 'Benutzer'}
                      color={user.is_admin ? 'primary' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {user.is_linked ? (
                      <Chip
                        icon={<LinkIcon />}
                        label="Verknüpft"
                        color="success"
                        size="small"
                      />
                    ) : (
                      <Chip
                        icon={<UnlinkIcon />}
                        label="Nicht verknüpft"
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
                      <Tooltip title="Admin-Rechte entziehen">
                        <IconButton
                          size="small"
                          onClick={() => handleToggleAdmin(user, false)}
                          color="warning"
                        >
                          <RemoveAdminIcon />
                        </IconButton>
                      </Tooltip>
                    ) : (
                      <Tooltip title="Zum Admin machen">
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
                      <Tooltip title="Verknüpfung aufheben">
                        <IconButton
                          size="small"
                          onClick={() => handleUnlink(user)}
                          color="info"
                        >
                          <UnlinkIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                    <Tooltip title="Benutzer löschen">
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
        <DialogTitle>Benutzer löschen</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Möchten Sie den Benutzer <strong>{userToDelete?.username}</strong> wirklich
            löschen? Diese Aktion kann nicht rückgängig gemacht werden.
            {userToDelete?.is_linked && (
              <>
                <br />
                <br />
                <strong>Hinweis:</strong> Der Benutzer ist mit einem Schützen verknüpft.
                Die Verknüpfung wird ebenfalls gelöscht.
              </>
            )}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel} color="primary">
            Abbrechen
          </Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Löschen
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

