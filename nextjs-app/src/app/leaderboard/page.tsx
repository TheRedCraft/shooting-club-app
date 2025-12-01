'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Container,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Box,
  CircularProgress,
  Alert,
  Chip,
  Avatar,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  Grid,
  Tooltip,
  IconButton,
  Button
} from '@mui/material';
import {
  EmojiEvents as TrophyIcon,
  TrendingUp as TrendingUpIcon,
  FilterList as FilterListIcon,
  Refresh as RefreshIcon,
  Star as StarIcon,
  Speed as SpeedIcon,
  Straighten as StraightenIcon
} from '@mui/icons-material';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { leaderboardService } from '@/lib/client/api';

interface LeaderboardEntry {
  rank: number;
  userId: number;
  username: string;
  firstName: string;
  lastName: string;
  sessionsCount: number;
  totalShots: number;
  avgScore: number;
  bestSessionScore: number;
  bestTeiler: number | null;
  memberSince: string;
}

export default function LeaderboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLinked, isAdmin, loading: authLoading } = useAuth();
  const { t } = useLanguage();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState('avgScore');
  const [timeRange, setTimeRange] = useState('all');
  const [meta, setMeta] = useState<any>(null);

  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }

    if (!isLinked() && !isAdmin()) {
      router.push('/pending-link');
      return;
    }

    loadLeaderboard();
  }, [authLoading, isAuthenticated, isLinked, isAdmin, router, sortBy, timeRange]);

  const loadLeaderboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await leaderboardService.getLeaderboard(sortBy, timeRange);
      setLeaderboard(response.data.leaderboard || []);
      setMeta(response.data.meta);
    } catch (err: any) {
      console.error('Error loading leaderboard:', err);
      setError(err.response?.data?.message || t.leaderboard.loading);
    } finally {
      setLoading(false);
    }
  };

  const handleSortChange = (event: any) => {
    setSortBy(event.target.value);
  };

  const handleTimeRangeChange = (event: any) => {
    setTimeRange(event.target.value);
  };

  const handleRefresh = () => {
    loadLeaderboard();
  };

  if (authLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!isAuthenticated() || (!isLinked() && !isAdmin())) {
    return null;
  }

  const getMedalColor = (rank: number) => {
    switch (rank) {
      case 1: return '#FFD700'; // Gold
      case 2: return '#C0C0C0'; // Silver
      case 3: return '#CD7F32'; // Bronze
      default: return 'transparent';
    }
  };

  const getMedalIcon = (rank: number) => {
    if (rank <= 3) {
      return (
        <Avatar
          sx={{
            bgcolor: getMedalColor(rank),
            width: 36,
            height: 36,
            fontSize: '1rem',
            fontWeight: 'bold',
            color: rank === 1 ? '#000' : '#fff',
            border: rank === 1 ? '3px solid #FFD700' : rank === 2 ? '3px solid #C0C0C0' : '3px solid #CD7F32',
            boxShadow: 3
          }}
        >
          {rank}
        </Avatar>
      );
    }
    return (
      <Typography variant="body1" fontWeight="medium" color="text.secondary">
        {rank}
      </Typography>
    );
  };

  const getSortLabel = () => {
    switch (sortBy) {
      case 'avgScore': return t.leaderboard.avgScore;
      case 'bestSessionScore': return t.leaderboard.totalScore;
      case 'bestTeiler': return t.leaderboard.bestTeiler;
      case 'totalSessions': return t.leaderboard.sessions;
      case 'totalShots': return t.leaderboard.mostShots;
      default: return t.leaderboard.avgScore;
    }
  };

  const currentUserEntry = leaderboard.find(entry => entry.username === user?.username);

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <TrophyIcon sx={{ fontSize: 40, color: 'primary.main' }} />
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h4" gutterBottom>
            {t.leaderboard.title}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t.leaderboard.sortBy}: {getSortLabel()}
          </Typography>
        </Box>
        <IconButton onClick={handleRefresh} disabled={loading}>
          <RefreshIcon />
        </IconButton>
      </Box>

      {/* Current User Stats Card */}
      {currentUserEntry && (
        <Card sx={{ mb: 3, bgcolor: 'primary.light', color: 'primary.contrastText' }}>
          <CardContent>
            <Grid container spacing={2} alignItems="center">
              <Grid size="auto">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  {getMedalIcon(currentUserEntry.rank)}
                  <Box>
                    <Typography variant="h6" fontWeight="bold">
                      {t.leaderboard.yourStats}: #{currentUserEntry.rank}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      {currentUserEntry.firstName} {currentUserEntry.lastName}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
              <Grid size={{ xs: 12, sm: 'auto' }} sx={{ display: 'flex', gap: 3, justifyContent: 'flex-end', flexWrap: 'wrap', ml: 'auto' }}>
                <Box textAlign="center">
                  <Typography variant="caption" sx={{ opacity: 0.9 }}>
                    {t.leaderboard.avgScore}
                  </Typography>
                  <Typography variant="h6" fontWeight="bold">
                    {currentUserEntry.avgScore.toFixed(2)}
                  </Typography>
                </Box>
                {currentUserEntry.bestTeiler && (
                  <Box textAlign="center">
                    <Typography variant="caption" sx={{ opacity: 0.9 }}>
                      {t.leaderboard.bestTeiler}
                    </Typography>
                    <Typography variant="h6" fontWeight="bold">
                      {currentUserEntry.bestTeiler.toFixed(1)} mm
                    </Typography>
                  </Box>
                )}
                <Box textAlign="center">
                  <Typography variant="caption" sx={{ opacity: 0.9 }}>
                    {t.leaderboard.sessions}
                  </Typography>
                  <Typography variant="h6" fontWeight="bold">
                    {currentUserEntry.sessionsCount}
                  </Typography>
                </Box>
                <Box textAlign="center">
                  <Typography variant="caption" sx={{ opacity: 0.9 }}>
                    {t.leaderboard.totalShots}
                  </Typography>
                  <Typography variant="h6" fontWeight="bold">
                    {currentUserEntry.totalShots.toLocaleString('de-DE')}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid size="auto">
            <FilterListIcon color="action" />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <FormControl fullWidth size="small">
              <InputLabel>{t.leaderboard.sortBy}</InputLabel>
              <Select
                value={sortBy}
                label={t.leaderboard.sortBy}
                onChange={handleSortChange}
              >
                <MenuItem value="avgScore">{t.leaderboard.avgScore}</MenuItem>
                <MenuItem value="bestSessionScore">{t.leaderboard.totalScore}</MenuItem>
                <MenuItem value="bestTeiler">{t.leaderboard.bestTeiler}</MenuItem>
                <MenuItem value="totalSessions">{t.leaderboard.sessions}</MenuItem>
                <MenuItem value="totalShots">{t.leaderboard.mostShots}</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <FormControl fullWidth size="small">
              <InputLabel>{t.leaderboard.timeRange}</InputLabel>
              <Select
                value={timeRange}
                label={t.leaderboard.timeRange}
                onChange={handleTimeRangeChange}
              >
                <MenuItem value="all">{t.dashboard.timeRange.all}</MenuItem>
                <MenuItem value="30">{t.dashboard.timeRange.days30}</MenuItem>
                <MenuItem value="90">{t.dashboard.timeRange.days90}</MenuItem>
                <MenuItem value="365">{t.dashboard.timeRange.days365}</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid size="auto">
            <Typography variant="body2" color="text.secondary">
              {meta && `${meta.totalPlayers} ${t.leaderboard.shooter}`}
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Leaderboard Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: 'background.default' }}>
              <TableCell width={80} align="center">
                <TrophyIcon fontSize="small" />
              </TableCell>
              <TableCell>{t.leaderboard.shooter}</TableCell>
              <TableCell align="right">{t.leaderboard.sessions}</TableCell>
              <TableCell align="right">{t.leaderboard.totalShots}</TableCell>
              <TableCell align="right">
                <Tooltip title={t.leaderboard.avgScore}>
                  <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
                    <TrendingUpIcon fontSize="small" />
                    Ø
                  </Box>
                </Tooltip>
              </TableCell>
              <TableCell align="right">
                <Tooltip title={t.leaderboard.totalScore}>
                  <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
                    <SpeedIcon fontSize="small" />
                    Top
                  </Box>
                </Tooltip>
              </TableCell>
              {sortBy === 'bestTeiler' && (
                <TableCell align="right">
                  <Tooltip title={t.leaderboard.bestTeiler}>
                    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
                      <StraightenIcon fontSize="small" />
                      {t.dashboard.teiler}
                    </Box>
                  </Tooltip>
                </TableCell>
              )}
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  <Box sx={{ py: 4 }}>
                    <CircularProgress />
                  </Box>
                </TableCell>
              </TableRow>
            ) : leaderboard.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  <Typography variant="body2" color="text.secondary" sx={{ py: 4 }}>
                    {t.leaderboard.noData}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              leaderboard.map((entry) => {
                const isCurrentUser = user?.username === entry.username;
                
                return (
                  <TableRow 
                    key={entry.userId}
                    sx={{ 
                      bgcolor: isCurrentUser ? 'action.selected' : 'inherit',
                      '&:hover': { bgcolor: 'action.hover' },
                      transition: 'background-color 0.2s'
                    }}
                  >
                    <TableCell align="center">
                      {getMedalIcon(entry.rank)}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box>
                          <Typography variant="body1" fontWeight={isCurrentUser ? 'bold' : 'normal'}>
                            {entry.firstName} {entry.lastName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            @{entry.username}
                          </Typography>
                        </Box>
                        {isCurrentUser && (
                          <Chip label="Du" size="small" color="primary" />
                        )}
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2">
                        {entry.sessionsCount}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" color="text.secondary">
                        {entry.totalShots.toLocaleString('de-DE')}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5 }}>
                        <Typography variant="body1" fontWeight="medium" color="primary">
                          {entry.avgScore.toFixed(2)}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" color="text.secondary">
                        {entry.bestSessionScore.toFixed(1)}
                      </Typography>
                    </TableCell>
                    {sortBy === 'bestTeiler' && (
                      <TableCell align="right">
                        {entry.bestTeiler ? (
                          <Typography variant="body2" color="success.main">
                            {entry.bestTeiler.toFixed(1)} mm
                          </Typography>
                        ) : (
                          <Typography variant="body2" color="text.disabled">
                            -
                          </Typography>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Footer Info */}
      {meta && (
        <Box sx={{ mt: 2, textAlign: 'center' }}>
          <Typography variant="caption" color="text.secondary">
            Letzte Aktualisierung: {new Date(meta.generatedAt).toLocaleString('de-DE')}
          </Typography>
        </Box>
      )}
    </Container>
  );
}

