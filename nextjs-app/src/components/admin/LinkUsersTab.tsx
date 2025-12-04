'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  Button,
  Alert,
  CircularProgress,
  Divider,
  Chip,
  TextField,
  InputAdornment
} from '@mui/material';
import {
  Link as LinkIcon,
  LinkOff as UnlinkIcon,
  Person as PersonIcon,
  SportsMartialArts as ShooterIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import { adminService } from '@/lib/client/api';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';

interface User {
  id: number;
  username: string;
  email: string;
  is_linked: boolean;
  shooter_id: string | null;
  shooter_name: string | null;
  is_super_admin?: boolean;
}

interface MeytonShooter {
  ShooterID: string;
  Lastname: string;
  Firstname: string;
  SportpassID?: string | null;
  club_name?: string;
}

export default function LinkUsersTab() {
  const { t } = useLanguage();
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [shooters, setShooters] = useState<MeytonShooter[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedShooter, setSelectedShooter] = useState<MeytonShooter | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [usersResponse, shootersResponse] = await Promise.all([
        adminService.getLinkedUsers(),
        adminService.getMeytonShooters()
      ]);
      setUsers(usersResponse.data);
      setShooters(shootersResponse.data);
      console.log(`✅ Loaded ${usersResponse.data.length} users and ${shootersResponse.data.length} shooters`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Fehler beim Laden der Daten');
      console.error('❌ Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleLinkUser = async () => {
    if (!selectedUser || !selectedShooter) {
      setError(t.admin.linkUsers.selectBoth);
      return;
    }

    try {
      console.log(`🔗 Linking user ${selectedUser.username} (${selectedUser.id}) to shooter ${selectedShooter.Firstname} ${selectedShooter.Lastname} (${selectedShooter.ShooterID})`);
      
      await adminService.linkUser(selectedUser.id, selectedShooter.ShooterID);
      
      setSuccess(
        t.admin.linkUsers.linkedSuccess
          .replace('{user}', selectedUser.username)
          .replace('{shooter}', `${selectedShooter.Firstname} ${selectedShooter.Lastname}`)
      );
      
      // Reset selections first
      setSelectedUser(null);
      setSelectedShooter(null);
      setSearchQuery('');
      
      // Then reload data
      await loadData();
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('❌ Error linking user:', err);
      setError(err.response?.data?.message || 'Fehler beim Verknüpfen');
    }
  };

  const handleUnlinkUser = async (user: User) => {
    if (!confirm(t.admin.linkUsers.confirmUnlink.replace('{username}', user.username))) {
      return;
    }

    try {
      console.log(`🔓 Unlinking user ${user.username} (${user.id})`);
      
      await adminService.unlinkUser(user.id);
      
      setSuccess(t.admin.linkUsers.unlinkedSuccess.replace('{user}', user.username));
      
      // Reload data
      await loadData();
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('❌ Error unlinking user:', err);
      setError(err.response?.data?.message || 'Fehler beim Trennen der Verknüpfung');
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={3}>
        <CircularProgress />
      </Box>
    );
  }

  const unlinkedUsers = users.filter(u => !u.is_linked);
  const linkedUsers = users.filter(u => u.is_linked);
  const linkedShooterIds = linkedUsers.map(u => u.shooter_id).filter(Boolean);
  
  // Filter shooters: available + search
  let availableShooters = shooters.filter(
    s => !linkedShooterIds.includes(s.ShooterID)
  );
  
  if (searchQuery.trim()) {
    const query = searchQuery.toLowerCase();
    availableShooters = availableShooters.filter(s => 
      `${s.Firstname} ${s.Lastname}`.toLowerCase().includes(query) ||
      s.ShooterID.toString().includes(query)
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
        {t.admin.linkUsers.description}
      </Typography>

      <Grid container spacing={3}>
        {/* Unlinked Users */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper variant="outlined" sx={{ height: 400, overflow: 'auto' }}>
            <Box sx={{ p: 2, bgcolor: 'primary.main', color: 'white' }}>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <PersonIcon /> {t.admin.linkUsers.unlinkedUsers}
              </Typography>
            </Box>
            <List>
              {unlinkedUsers.length === 0 ? (
                <ListItem>
                  <ListItemText 
                    primary={t.admin.linkUsers.noUsers} 
                    secondary={t.admin.linkUsers.allLinked}
                  />
                </ListItem>
              ) : (
                unlinkedUsers.map((user) => (
                  <ListItemButton
                    key={user.id}
                    selected={selectedUser?.id === user.id}
                    onClick={() => setSelectedUser(user)}
                  >
                    <ListItemText
                      primary={user.username}
                      secondary={user.email}
                    />
                  </ListItemButton>
                ))
              )}
            </List>
          </Paper>
        </Grid>

        {/* Available Shooters */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper variant="outlined" sx={{ height: 400, display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ p: 2, bgcolor: 'success.main', color: 'white' }}>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <ShooterIcon /> {t.admin.linkUsers.availableShooters}
              </Typography>
            </Box>
            <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
              <TextField
                fullWidth
                size="small"
                placeholder={t.admin.linkUsers.searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Box>
            <List sx={{ flex: 1, overflow: 'auto' }}>
              {availableShooters.length === 0 ? (
                <ListItem>
                  <ListItemText 
                    primary={searchQuery ? t.admin.linkUsers.noResults : t.admin.linkUsers.noShooters} 
                    secondary={searchQuery ? t.admin.linkUsers.tryDifferent : t.admin.linkUsers.allLinked}
                  />
                </ListItem>
              ) : (
                <>
                  {searchQuery && (
                    <ListItem>
                      <Typography variant="caption" color="text.secondary">
                        {availableShooters.length} {availableShooters.length === 1 ? t.admin.linkUsers.results : t.admin.linkUsers.resultsPlural}
                      </Typography>
                    </ListItem>
                  )}
                  {availableShooters.map((shooter) => (
                    <ListItemButton
                      key={shooter.ShooterID}
                      selected={selectedShooter?.ShooterID === shooter.ShooterID}
                      onClick={() => setSelectedShooter(shooter)}
                    >
                      <ListItemText
                        primary={`${shooter.Firstname} ${shooter.Lastname}`}
                        secondary={
                          <>
                            {shooter.SportpassID && `Sportpass: ${shooter.SportpassID}`}
                            {shooter.SportpassID && shooter.club_name && ' • '}
                            {shooter.club_name || ''}
                          </>
                        }
                      />
                    </ListItemButton>
                  ))}
                </>
              )}
            </List>
          </Paper>
        </Grid>

        {/* Linked Users */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper variant="outlined" sx={{ height: 400, overflow: 'auto' }}>
            <Box sx={{ p: 2, bgcolor: 'info.main', color: 'white' }}>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <LinkIcon /> {t.admin.linkUsers.linkedUsers}
              </Typography>
            </Box>
            <List>
              {linkedUsers.length === 0 ? (
                <ListItem>
                  <ListItemText primary={t.admin.linkUsers.noUsers} />
                </ListItem>
              ) : (
                linkedUsers.map((user) => (
                  <ListItem
                    key={user.id}
                    secondaryAction={
                      user.is_super_admin && currentUser?.id !== user.id ? (
                        <Button
                          size="small"
                          disabled
                          title="Der Super-Administrator kann nicht von anderen getrennt werden"
                        >
                          <UnlinkIcon />
                        </Button>
                      ) : (
                        <Button
                          size="small"
                          color="error"
                          onClick={() => handleUnlinkUser(user)}
                        >
                          <UnlinkIcon />
                        </Button>
                      )
                    }
                  >
                    <ListItemText
                      primary={user.username}
                      secondary={
                        <Box component="span" sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                          <Typography variant="body2" component="span" color="text.secondary">
                            {user.shooter_name}
                          </Typography>
                          <Chip 
                            label={`ID: ${user.shooter_id}`} 
                            size="small" 
                            component="span"
                          />
                        </Box>
                      }
                      secondaryTypographyProps={{
                        component: 'span'
                      }}
                    />
                  </ListItem>
                ))
              )}
            </List>
          </Paper>
        </Grid>
      </Grid>

      <Divider sx={{ my: 3 }} />

      {/* Link Button */}
      <Box sx={{ textAlign: 'center' }}>
        <Button
          variant="contained"
          size="large"
          startIcon={<LinkIcon />}
          onClick={handleLinkUser}
          disabled={!selectedUser || !selectedShooter}
          sx={{ minWidth: 300 }}
        >
          {t.admin.linkUsers.linkButton}
        </Button>
        {selectedUser && selectedShooter && (
          <Typography variant="caption" display="block" sx={{ mt: 1 }}>
            {selectedUser.username} ➜ {selectedShooter.Firstname} {selectedShooter.Lastname}
          </Typography>
        )}
      </Box>
    </Box>
  );
}

