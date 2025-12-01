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
  Button,
  Chip,
  Alert,
  CircularProgress,
  Typography,
  Paper
} from '@mui/material';
import { CheckCircle as ApproveIcon, Cancel as RejectIcon } from '@mui/icons-material';
import { adminService } from '@/lib/client/api';

interface PendingUser {
  id: number;
  username: string;
  email: string;
  created_at: string;
}

export default function PendingUsersTab() {
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadPendingUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await adminService.getPendingUsers();
      setPendingUsers(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Fehler beim Laden der Benutzer');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPendingUsers();
  }, []);

  const handleApprove = async (userId: number, username: string) => {
    try {
      await adminService.approveUser(userId);
      setSuccess(`Benutzer "${username}" wurde freigegeben und kann jetzt einem Schützen zugeordnet werden`);
      setPendingUsers(pendingUsers.filter(u => u.id !== userId));
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Fehler beim Freigeben des Benutzers');
    }
  };

  const handleReject = async (userId: number, username: string) => {
    if (!confirm(`Möchten Sie den Benutzer "${username}" wirklich ablehnen und löschen?`)) {
      return;
    }

    try {
      await adminService.deleteUser(userId);
      setSuccess(`Benutzer "${username}" wurde abgelehnt und gelöscht`);
      setPendingUsers(pendingUsers.filter(u => u.id !== userId));
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Fehler beim Ablehnen des Benutzers');
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
        Benutzer, die sich registriert haben und auf Freigabe warten.
      </Typography>

      {pendingUsers.length === 0 ? (
        <Alert severity="info">
          Keine ausstehenden Freigabe-Anfragen
        </Alert>
      ) : (
        <TableContainer component={Paper} variant="outlined">
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Benutzername</TableCell>
                <TableCell>E-Mail</TableCell>
                <TableCell>Registriert am</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Aktionen</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {pendingUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.username}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    {new Date(user.created_at).toLocaleDateString('de-DE')}
                  </TableCell>
                  <TableCell>
                    <Chip label="Ausstehend" color="warning" size="small" />
                  </TableCell>
                  <TableCell align="right">
                    <Button
                      size="small"
                      variant="contained"
                      color="success"
                      startIcon={<ApproveIcon />}
                      onClick={() => handleApprove(user.id, user.username)}
                      sx={{ mr: 1 }}
                    >
                      Freigeben
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      color="error"
                      startIcon={<RejectIcon />}
                      onClick={() => handleReject(user.id, user.username)}
                    >
                      Ablehnen
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}

