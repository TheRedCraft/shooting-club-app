'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Alert,
  Chip,
  Switch,
  FormControlLabel,
  Divider
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import axios from 'axios';
import TargetVisualization from './TargetVisualization';
import { useRingMode } from '@/contexts/RingModeContext';
import { useLanguage } from '@/lib/i18n/LanguageContext';

interface SessionDetailsModalProps {
  open: boolean;
  onClose: () => void;
  sessionId: string | null;
}

export default function SessionDetailsModal({ open, onClose, sessionId }: SessionDetailsModalProps) {
  const { formatScore } = useRingMode();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);
  
  // Local toggles for visualization
  const [showTeiler, setShowTeiler] = useState(true);
  const [showSpread, setShowSpread] = useState(true);
  const [showCenter, setShowCenter] = useState(true);
  const [localRingMode, setLocalRingMode] = useState<'decimal' | 'normal'>('decimal');
  const zoomScale = 10; // Fixed maximum zoom

  useEffect(() => {
    if (open && sessionId) {
      loadSessionData();
    }
  }, [open, sessionId]);

  const loadSessionData = async () => {
    if (!sessionId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/sessions/${sessionId}/shots`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setData(response.data);
    } catch (err: any) {
      console.error('Error loading session data:', err);
      setError(err.response?.data?.message || t.sessions.loading);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setData(null);
    setError(null);
    onClose();
  };

  if (!open) return null;

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="xl"
      fullWidth
      PaperProps={{
        sx: { minHeight: '80vh' }
      }}
    >
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h5">
            {t.sessions.sessionDetails}
          </Typography>
          <Button onClick={handleClose} color="inherit">
            <CloseIcon />
          </Button>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        {loading && (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
            <CircularProgress />
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {data && data.success && (
          <Grid container spacing={3}>
            {/* Session Info */}
            {data.session && (
              <Grid size={{ xs: 12 }}>
                <Card variant="outlined">
                  <CardContent>
                    <Grid container spacing={2}>
                      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <Typography variant="body2" color="text.secondary">
                          {t.leaderboard.shooter}
                        </Typography>
                        <Typography variant="h6">
                          {data.session.shooter_name}
                        </Typography>
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <Typography variant="body2" color="text.secondary">
                          {t.sessions.date}
                        </Typography>
                        <Typography variant="h6">
                          {new Date(data.session.date).toLocaleDateString('de-DE')}
                        </Typography>
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <Typography variant="body2" color="text.secondary">
                          {t.sessions.discipline}
                        </Typography>
                        <Typography variant="h6">
                          {data.session.discipline}
                        </Typography>
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <Typography variant="body2" color="text.secondary">
                          {t.sessions.totalScore}
                        </Typography>
                        <Typography variant="h6">
                          {t.sessions.normal}: {Math.floor(data.session.total_score / 10)} | {t.sessions.decimal}: {data.session.total_score_decimal}
                        </Typography>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            )}

            {/* Visualization Controls */}
            <Grid size={{ xs: 12 }}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle1" gutterBottom>
                    {t.sessions.displayOptions}
                  </Typography>
                  <Box display="flex" flexWrap="wrap" gap={2} mb={2}>
                    <FormControlLabel
                      control={
                        <Switch 
                          checked={localRingMode === 'decimal'} 
                          onChange={(e) => setLocalRingMode(e.target.checked ? 'decimal' : 'normal')}
                        />
                      }
                      label={t.sessions.showDecimalRings}
                    />
                    <FormControlLabel
                      control={<Switch checked={showTeiler} onChange={(e) => setShowTeiler(e.target.checked)} />}
                      label={t.sessions.showTeiler}
                    />
                    <FormControlLabel
                      control={<Switch checked={showSpread} onChange={(e) => setShowSpread(e.target.checked)} />}
                      label={t.sessions.showSpread}
                    />
                    <FormControlLabel
                      control={<Switch checked={showCenter} onChange={(e) => setShowCenter(e.target.checked)} />}
                      label={t.sessions.showCenter}
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Target Visualization */}
            <Grid size={{ xs: 12, lg: 8 }}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {t.sessions.targetImage}
                  </Typography>
                  {data.shots && data.analysis && (
                    <TargetVisualization
                      shots={data.shots}
                      analysis={data.analysis}
                      ringMode={localRingMode}
                      showTeiler={showTeiler}
                      showSpread={showSpread}
                      showCenter={showCenter}
                      scale={zoomScale}
                      discipline={data.session?.discipline}
                    />
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* Statistics */}
            <Grid size={{ xs: 12, lg: 4 }}>
              {/* Teiler Statistics */}
              <Card sx={{ mb: 2 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {t.sessions.teiler}
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  {data.analysis?.teiler && (
                    <>
                      <Box display="flex" justifyContent="space-between" mb={1}>
                        <Typography>{t.sessions.stats.best}</Typography>
                        <Chip label={data.analysis.teiler.best.toFixed(1)} color="success" size="small" />
                      </Box>
                      <Box display="flex" justifyContent="space-between" mb={1}>
                        <Typography>{t.sessions.stats.worst}</Typography>
                        <Chip label={data.analysis.teiler.worst.toFixed(1)} color="error" size="small" />
                      </Box>
                      <Box display="flex" justifyContent="space-between" mb={1}>
                        <Typography>{t.sessions.stats.average}</Typography>
                        <Chip label={data.analysis.teiler.average.toFixed(1)} color="primary" size="small" />
                      </Box>
                      {data.session?.best_teiler && (
                        <Box display="flex" justifyContent="space-between">
                          <Typography variant="caption" color="text.secondary">
                            ({t.sessions.stats.meytonDb} {data.session.best_teiler})
                          </Typography>
                        </Box>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Spread Statistics */}
              <Card sx={{ mb: 2 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {t.sessions.spread}
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  {data.analysis?.spread && (
                    <>
                      <Box display="flex" justifyContent="space-between" mb={1}>
                        <Typography>{t.sessions.stats.xAxis}</Typography>
                        <Typography fontWeight="bold">{data.analysis.spread.x_std.toFixed(2)} mm</Typography>
                      </Box>
                      <Box display="flex" justifyContent="space-between" mb={1}>
                        <Typography>{t.sessions.stats.yAxis}</Typography>
                        <Typography fontWeight="bold">{data.analysis.spread.y_std.toFixed(2)} mm</Typography>
                      </Box>
                      <Box display="flex" justifyContent="space-between" mb={1}>
                        <Typography>{t.sessions.stats.total}</Typography>
                        <Typography fontWeight="bold">{data.analysis.spread.total.toFixed(2)} mm</Typography>
                      </Box>
                      <Box display="flex" justifyContent="space-between">
                        <Typography>{t.sessions.stats.spreadCircle}</Typography>
                        <Typography fontWeight="bold">{data.analysis.spread.radius.toFixed(2)} mm</Typography>
                      </Box>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Offset Statistics */}
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {t.sessions.offset}
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  {data.analysis?.center && (
                    <>
                      <Box display="flex" justifyContent="space-between" mb={1}>
                        <Typography>{t.sessions.stats.distanceFromCenter}</Typography>
                        <Typography fontWeight="bold">{data.analysis.center.offset.toFixed(2)} mm</Typography>
                      </Box>
                      <Box display="flex" justifyContent="space-between" mb={1}>
                        <Typography>{t.sessions.stats.horizontal}</Typography>
                        <Typography fontWeight="bold">
                          {Math.abs(data.analysis.center.x).toFixed(2)} mm {data.analysis.center.direction.x}
                        </Typography>
                      </Box>
                      <Box display="flex" justifyContent="space-between" mb={1}>
                        <Typography>{t.sessions.stats.vertical}</Typography>
                        <Typography fontWeight="bold">
                          {Math.abs(data.analysis.center.y).toFixed(2)} mm {data.analysis.center.direction.y}
                        </Typography>
                      </Box>
                      <Box display="flex" justifyContent="space-between">
                        <Typography>{t.sessions.stats.tendency}</Typography>
                        <Chip 
                          label={data.analysis.tendency?.dominant
                            .replace('_', ' ')
                            .replace('top', t.sessions.directions.top)
                            .replace('bottom', t.sessions.directions.bottom)
                            .replace('left', t.sessions.directions.left)
                            .replace('right', t.sessions.directions.right)
                            .replace('center', t.sessions.directions.center)} 
                          size="small" 
                        />
                      </Box>
                    </>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} variant="contained">
          {t.common.close}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

