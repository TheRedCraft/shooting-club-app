'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Alert,
  Button,
  FormControlLabel,
  Switch,
  Paper,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Skeleton
} from '@mui/material';
import { Visibility as VisibilityIcon, FilterList as FilterListIcon, Refresh as RefreshIcon } from '@mui/icons-material';
import { useAuth } from '@/contexts/AuthContext';
import { useRingMode } from '@/contexts/RingModeContext';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { dashboardService } from '@/lib/client/api';
import SessionDetailsModal from '@/components/SessionDetailsModal';
import Pagination from '@/components/Pagination';
import TrendDialog from '@/components/TrendDialog';

export default function DashboardPage() {
  const router = useRouter();
  const { isAuthenticated, isLinked, isAdmin, loading: authLoading } = useAuth();
  const { ringMode, toggleRingMode, formatScore } = useRingMode();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState<any>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [timeRange, setTimeRange] = useState<string>('all');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<any>(null);
  const sessionsPerPage = 10;
  
  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  
  // Trend Dialog state
  const [trendDialogOpen, setTrendDialogOpen] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState<'avgScore' | 'bestScore' | 'bestTeiler' | 'avgSpread' | 'avgOffset'>('avgScore');
  const [selectedMetricTitle, setSelectedMetricTitle] = useState('');

  const handleOpenModal = (sessionId: string | number) => {
    // Ensure sessionId is a valid string (convert number to string if needed)
    if (sessionId == null) {
      console.error(`Session ID is null or undefined`);
      return;
    }
    
    // Convert to string first
    const rawString = String(sessionId).trim();
    let idString: string;
    
    // IMPORTANT: MySQL stores ScheibenID as SIGNED INT, so negative IDs are valid
    // We need to accept both positive and negative integers
    // The database uses the original signed integer value
    if (rawString.startsWith('-')) {
      // Negative number - validate it's a valid integer
      const signedInt = parseInt(rawString, 10);
      if (!isNaN(signedInt)) {
        idString = rawString; // Keep the negative ID as-is for database queries
      } else {
        console.error(`Invalid negative session ID: ${rawString}`);
        return;
      }
    } else {
      // Positive number - validate it's numeric
      if (!/^\d+$/.test(rawString)) {
        console.error(`Invalid session ID format: ${rawString}`);
        return;
      }
      idString = rawString;
    }
    
    // Validate it's a valid integer (positive or negative)
    if (!idString || !/^-?\d+$/.test(idString)) {
      console.error(`Invalid session ID passed to handleOpenModal: ${sessionId} (type: ${typeof sessionId})`);
      return;
    }
    
    setSelectedSessionId(idString);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedSessionId(null);
  };
  
  const handleOpenTrendDialog = (metric: 'avgScore' | 'bestScore' | 'bestTeiler' | 'avgSpread' | 'avgOffset', title: string) => {
    setSelectedMetric(metric);
    setSelectedMetricTitle(title);
    setTrendDialogOpen(true);
  };
  
  const handleCloseTrendDialog = () => {
    setTrendDialogOpen(false);
  };

  useEffect(() => {
    if (authLoading) return;

    // Check if user is authenticated and linked
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }

    if (!isLinked() && !isAdmin()) {
      router.push('/pending-link');
      return;
    }

    // Load dashboard data
    loadDashboardData();
  }, [authLoading, isAuthenticated, isLinked, isAdmin, router, timeRange, currentPage]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, sessionsRes] = await Promise.all([
        dashboardService.getStats(timeRange),
        dashboardService.getRecentSessions(timeRange, currentPage, sessionsPerPage)
      ]);

      setStats(statsRes.data.stats);
      setSessions(sessionsRes.data.sessions || []);
      setPagination(sessionsRes.data.pagination || null);
    } catch (err: any) {
      console.error('Error loading dashboard:', err);
      // Check if it's the specific "Failed to get stats" error
      const errorMessage = err.response?.data?.message;
      if (errorMessage === 'Failed to get stats') {
        setError(t.dashboard.failedToGetStats);
      } else {
        setError(errorMessage || t.dashboard.error);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleTimeRangeChange = (event: any) => {
    setTimeRange(event.target.value);
    setCurrentPage(1); // Reset to first page when changing time range
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Scroll to top of sessions section
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (authLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!isAuthenticated() || (!isLinked() && !isAdmin())) {
    return null;
  }

  return (
    <>
      <Container sx={{ py: 4 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
          <Typography variant="h4">
            {t.dashboard.title}
          </Typography>
          
          <Box display="flex" gap={2} alignItems="center" flexWrap="wrap">
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel id="time-range-label">{t.dashboard.timeRange.all}</InputLabel>
              <Select
                labelId="time-range-label"
                value={timeRange}
                label={t.dashboard.timeRange.all}
                onChange={handleTimeRangeChange}
                startAdornment={<FilterListIcon sx={{ mr: 1, color: 'action.active' }} />}
              >
                <MenuItem value="all">{t.dashboard.timeRange.all}</MenuItem>
                <MenuItem value="7">{t.dashboard.timeRange.days7}</MenuItem>
                <MenuItem value="30">{t.dashboard.timeRange.days30}</MenuItem>
                <MenuItem value="90">{t.dashboard.timeRange.days90}</MenuItem>
                <MenuItem value="365">{t.dashboard.timeRange.days365}</MenuItem>
              </Select>
            </FormControl>
            
            <FormControlLabel
              control={
                <Switch 
                  checked={ringMode === 'decimal'} 
                  onChange={toggleRingMode}
                  color="primary"
                />
              }
              label={ringMode === 'decimal' ? t.dashboard.ringMode.decimal : t.dashboard.ringMode.normal}
            />
          </Box>
        </Box>

      {/* Error Message */}
      {error && (
        <Alert 
          severity="error" 
          sx={{ mb: 3 }}
          action={
            <Button color="inherit" size="small" onClick={loadDashboardData} startIcon={<RefreshIcon />}>
              {t.common.refresh}
            </Button>
          }
        >
          {error}
        </Alert>
      )}

      {loading ? (
        <>
          {/* Loading Skeleton for Stats */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            {[1, 2, 3, 4].map((i) => (
              <Grid size={{ xs: 12, sm: 6, md: 3 }} key={i}>
                <Card>
                  <CardContent>
                    <Skeleton variant="text" width="60%" height={24} />
                    <Skeleton variant="text" width="80%" height={48} />
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
          
          {/* Loading Skeleton for Sessions */}
          <Skeleton variant="text" width="40%" height={32} sx={{ mb: 2 }} />
          <Grid container spacing={2}>
            {[1, 2, 3].map((i) => (
              <Grid size={{ xs: 12 }} key={i}>
                <Card>
                  <CardContent>
                    <Skeleton variant="text" width="100%" height={80} />
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </>
      ) : stats && (
        <>
          {/* Primary Stats */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    {t.dashboard.stats.totalSessions}
                  </Typography>
                  <Typography variant="h4">
                    {stats.totalSessions}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    {t.dashboard.stats.totalShots}
                  </Typography>
                  <Typography variant="h4">
                    {stats.totalShots}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card
                sx={{ 
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 4
                  }
                }}
                onClick={() => handleOpenTrendDialog('avgScore', t.dashboard.stats.avgScore)}
              >
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    {t.dashboard.stats.avgScore}
                  </Typography>
                  <Typography variant="h4">
                    {ringMode === 'decimal' ? stats.averageScore : stats.averageScoreNormal}
                  </Typography>
                  <Typography variant="caption" color="primary" sx={{ mt: 1, display: 'block' }}>
                    📈 {t.trends.title}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card
                sx={{ 
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 4
                  }
                }}
                onClick={() => handleOpenTrendDialog('bestScore', t.dashboard.stats.bestScore)}
              >
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    {t.dashboard.stats.bestScore}
                  </Typography>
                  <Typography variant="h4">
                    {ringMode === 'decimal' ? stats.bestScore : stats.bestScoreNormal}
                  </Typography>
                  <Typography variant="caption" color="primary" sx={{ mt: 1, display: 'block' }}>
                    📈 {t.trends.title}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Advanced Analytics */}
          {(stats.bestTeiler || stats.avgSpread || stats.avgOffset) && (
            <>
              <Typography variant="h5" gutterBottom sx={{ mt: 2, mb: 2 }}>
                {t.dashboard.shotAnalysis}
              </Typography>
              <Grid container spacing={3} sx={{ mb: 4 }}>
                {stats.bestTeiler && (
                  <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                    <Card 
                      sx={{ 
                        bgcolor: 'success.light', 
                        color: 'success.contrastText',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: 4
                        }
                      }}
                      onClick={() => handleOpenTrendDialog('bestTeiler', t.dashboard.bestTeilerTitle)}
                    >
                      <CardContent>
                        <Typography variant="subtitle2" gutterBottom>
                          🎯 {t.dashboard.bestTeilerTitle}
                        </Typography>
                        <Typography variant="h4">
                          {stats.bestTeiler}
                        </Typography>
                        <Typography variant="caption" sx={{ opacity: 0.8 }}>
                          {t.dashboard.bestTeilerDesc}
                        </Typography>
                        <Typography variant="caption" sx={{ mt: 1, display: 'block', fontWeight: 'bold' }}>
                          📈 {t.dashboard.showTrend}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                )}
                
                {stats.avgSpread && (
                  <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                    <Card 
                      sx={{ 
                        bgcolor: 'info.light', 
                        color: 'info.contrastText',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: 4
                        }
                      }}
                      onClick={() => handleOpenTrendDialog('avgSpread', t.dashboard.avgSpreadTitle)}
                    >
                      <CardContent>
                        <Typography variant="subtitle2" gutterBottom>
                          📊 {t.dashboard.avgSpreadTitle}
                        </Typography>
                        <Typography variant="h4">
                          {stats.avgSpread} mm
                        </Typography>
                        <Typography variant="caption" sx={{ opacity: 0.8 }}>
                          {t.dashboard.avgSpreadDesc}
                        </Typography>
                        <Typography variant="caption" sx={{ mt: 1, display: 'block', fontWeight: 'bold' }}>
                          📈 {t.dashboard.showTrend}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                )}
                
                {stats.avgOffset && (
                  <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                    <Card 
                      sx={{ 
                        bgcolor: 'warning.light', 
                        color: 'warning.contrastText',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: 4
                        }
                      }}
                      onClick={() => handleOpenTrendDialog('avgOffset', t.dashboard.avgOffsetTitle)}
                    >
                      <CardContent>
                        <Typography variant="subtitle2" gutterBottom>
                          🎪 {t.dashboard.avgOffsetTitle}
                        </Typography>
                        <Typography variant="h4">
                          {stats.avgOffset.distance} mm
                        </Typography>
                        <Typography variant="caption" sx={{ opacity: 0.8 }}>
                          {stats.avgOffset.direction.x !== 'zentral' && `${Math.abs(parseFloat(stats.avgOffset.x)).toFixed(1)}mm ${stats.avgOffset.direction.x}`}
                          {stats.avgOffset.direction.x !== 'zentral' && stats.avgOffset.direction.y !== 'zentral' && ', '}
                          {stats.avgOffset.direction.y !== 'zentral' && `${Math.abs(parseFloat(stats.avgOffset.y)).toFixed(1)}mm ${stats.avgOffset.direction.y}`}
                          {stats.avgOffset.direction.x === 'zentral' && stats.avgOffset.direction.y === 'zentral' && t.dashboard.perfectCenter}
                        </Typography>
                        <Typography variant="caption" sx={{ mt: 1, display: 'block', fontWeight: 'bold' }}>
                          📈 {t.dashboard.showTrend}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                )}
              </Grid>
            </>
          )}
          
          {/* Recent Sessions */}
          <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
            {t.dashboard.recentSessions}
          </Typography>
          
          {sessions.length === 0 ? (
            <Alert severity="info" sx={{ mt: 2 }}>
              {t.dashboard.noSessions}
            </Alert>
          ) : (
            <>
            <Grid container spacing={2}>
              {sessions.map((session, index) => (
          <Grid size={{ xs: 12 }} key={index}>
            <Card>
              <CardContent>
                <Grid container spacing={2} alignItems="center">
                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <Typography variant="subtitle1">
                      {new Date(session.session_date).toLocaleDateString()}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {session.discipline}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 4, sm: 3, md: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      {t.dashboard.score}
                    </Typography>
                    <Typography variant="h6">
                      {ringMode === 'decimal' 
                        ? ((session.total_score_decimal || session.total_score) / 10).toFixed(1)  // 2712 → 271.2
                        : Math.floor((session.total_score || session.total_score_decimal) / 10)    // 2580 → 258
                      }
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 4, sm: 3, md: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      {t.dashboard.shots}
                    </Typography>
                    <Typography variant="h6">
                      {session.shots_count}
                    </Typography>
                  </Grid>
                  
                  {/* Session Analysis Data */}
                  {session.analysis && (
                    <Grid size={{ xs: 12, md: 3 }}>
                      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            {t.dashboard.teiler}
                          </Typography>
                          <Typography variant="body2" fontWeight="bold">
                            {session.analysis.bestTeiler.toFixed(1)}
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            {t.dashboard.spread}
                          </Typography>
                          <Typography variant="body2" fontWeight="bold">
                            {session.analysis.spread.toFixed(1)}mm
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            {t.dashboard.offset}
                          </Typography>
                          <Typography variant="body2" fontWeight="bold">
                            {session.analysis.offset.toFixed(1)}mm
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>
                  )}
                  
                  <Grid size={{ xs: 12, sm: 12, md: session.analysis ? 2 : 5 }} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<VisibilityIcon />}
                      onClick={() => handleOpenModal(session.session_id)}
                    >
                      {t.dashboard.viewDetails}
                    </Button>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
              </Grid>
            ))}
          </Grid>
            
            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <Pagination
                currentPage={pagination.currentPage}
                totalPages={pagination.totalPages}
                onPageChange={handlePageChange}
                totalItems={pagination.totalSessions}
                itemsPerPage={pagination.sessionsPerPage}
                loading={loading}
              />
            )}
          </>
        )}
        </>
      )}
      </Container>

      {/* Session Details Modal */}
      <SessionDetailsModal
        open={modalOpen}
        onClose={handleCloseModal}
        sessionId={selectedSessionId}
      />
      
      {/* Trend Dialog */}
      <TrendDialog
        open={trendDialogOpen}
        onClose={handleCloseTrendDialog}
        metric={selectedMetric}
        title={selectedMetricTitle}
      />
    </>
  );
}

