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
import { useLanguage } from '@/lib/i18n/LanguageContext';

interface PendingUser {
  id: number;
  username: string;
  email: string;
  created_at: string;
}

export default function PendingUsersTab() {
  const { t } = useLanguage();
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
      setError(err.response?.data?.message || t.admin.pending.errorLoading);
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
      setSuccess(t.admin.pending.approveSuccess.replace('{username}', username));
      setPendingUsers(pendingUsers.filter(u => u.id !== userId));
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || t.admin.pending.errorApprove);
    }
  };

  const handleReject = async (userId: number, username: string) => {
    if (!confirm(t.admin.pending.rejectConfirm.replace('{username}', username))) {
      return;
    }

    try {
      await adminService.deleteUser(userId);
      setSuccess(t.admin.pending.rejectSuccess.replace('{username}', username));
      setPendingUsers(pendingUsers.filter(u => u.id !== userId));
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || t.admin.pending.errorReject);
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
        {t.admin.pending.description}
      </Typography>

      {pendingUsers.length === 0 ? (
        <Alert severity="info">
          {t.admin.pending.noRequests}
        </Alert>
      ) : (
        <TableContainer component={Paper} variant="outlined">
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>{t.admin.pending.username}</TableCell>
                <TableCell>{t.admin.pending.email}</TableCell>
                <TableCell>{t.admin.pending.requestDate}</TableCell>
                <TableCell>{t.admin.pending.status}</TableCell>
                <TableCell align="right">{t.admin.pending.actions}</TableCell>
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
                    <Chip label={t.admin.pending.pending} color="warning" size="small" />
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
                      {t.admin.pending.approve}
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      color="error"
                      startIcon={<RejectIcon />}
                      onClick={() => handleReject(user.id, user.username)}
                    >
                      {t.admin.pending.reject}
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

