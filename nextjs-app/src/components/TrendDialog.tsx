'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  CircularProgress,
  Alert,
  ToggleButtonGroup,
  ToggleButton,
  Typography,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { TrendingUp, ShowChart, BarChart as BarChartIcon } from '@mui/icons-material';
import api from '@/lib/client/api';
import { useLanguage } from '@/lib/i18n/LanguageContext';

interface TrendDialogProps {
  open: boolean;
  onClose: () => void;
  metric: 'avgScore' | 'bestScore' | 'bestTeiler' | 'avgSpread' | 'avgOffset';
  title: string;
}

export default function TrendDialog({ open, onClose, metric, title }: TrendDialogProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { t } = useLanguage();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [trendData, setTrendData] = useState<any[]>([]);
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('monthly');
  const [chartType, setChartType] = useState<'line' | 'bar' | 'area'>('line');
  
  useEffect(() => {
    if (open) {
      loadTrendData();
    }
  }, [open, metric, period]);
  
  const loadTrendData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await api.get(`/dashboard/trends?metric=${metric}&period=${period}&limit=12`);
      
      if (response.data.success) {
        setTrendData(response.data.data || []);
      } else {
        setError(response.data.message || t.trends.loading);
      }
    } catch (err: any) {
      console.error('Error loading trend data:', err);
      setError(err.response?.data?.message || t.trends.loading);
    } finally {
      setLoading(false);
    }
  };
  
  const handlePeriodChange = (_event: any, newPeriod: 'daily' | 'weekly' | 'monthly' | null) => {
    if (newPeriod) {
      setPeriod(newPeriod);
    }
  };
  
  const handleChartTypeChange = (_event: any, newType: 'line' | 'bar' | 'area' | null) => {
    if (newType) {
      setChartType(newType);
    }
  };
  
  const getMetricLabel = () => {
    switch (metric) {
      case 'avgScore':
        return 'Durchschnittlicher Score';
      case 'bestScore':
        return 'Bester Score';
      case 'bestTeiler':
        return 'Bester Teiler';
      case 'avgSpread':
        return 'Durchschnittliche Streuung';
      case 'avgOffset':
        return 'Durchschnittliche Verschiebung';
      default:
        return 'Metrik';
    }
  };
  
  const getMetricUnit = () => {
    switch (metric) {
      case 'avgScore':
      case 'bestScore':
        return 'Ringe';
      case 'bestTeiler':
      case 'avgSpread':
      case 'avgOffset':
        return 'mm';
      default:
        return '';
    }
  };
  
  const renderChart = () => {
    if (loading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
          <CircularProgress />
        </Box>
      );
    }
    
    if (error) {
      return (
        <Alert severity="error" sx={{ my: 2 }}>
          {error}
        </Alert>
      );
    }
    
    if (trendData.length === 0) {
      return (
        <Alert severity="info" sx={{ my: 2 }}>
          {t.trends.noData}
        </Alert>
      );
    }
    
    const chartColor = theme.palette.primary.main;
    const chartHeight = isMobile ? 300 : 400;
    
    const commonProps = {
      data: trendData,
      margin: { top: 10, right: 30, left: 0, bottom: 0 }
    };
    
    return (
      <ResponsiveContainer width="100%" height={chartHeight}>
        {chartType === 'line' ? (
          <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="period" 
              tick={{ fontSize: isMobile ? 10 : 12 }}
              angle={isMobile ? -45 : 0}
              textAnchor={isMobile ? 'end' : 'middle'}
              height={isMobile ? 60 : 30}
            />
            <YAxis tick={{ fontSize: isMobile ? 10 : 12 }} />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: theme.palette.background.paper,
                border: `1px solid ${theme.palette.divider}`
              }}
              formatter={(value: any) => [`${value} ${getMetricUnit()}`, getMetricLabel()]}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="value" 
              stroke={chartColor} 
              strokeWidth={2}
              name={getMetricLabel()}
              dot={{ fill: chartColor, r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        ) : chartType === 'bar' ? (
          <BarChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="period" 
              tick={{ fontSize: isMobile ? 10 : 12 }}
              angle={isMobile ? -45 : 0}
              textAnchor={isMobile ? 'end' : 'middle'}
              height={isMobile ? 60 : 30}
            />
            <YAxis tick={{ fontSize: isMobile ? 10 : 12 }} />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: theme.palette.background.paper,
                border: `1px solid ${theme.palette.divider}`
              }}
              formatter={(value: any) => [`${value} ${getMetricUnit()}`, getMetricLabel()]}
            />
            <Legend />
            <Bar 
              dataKey="value" 
              fill={chartColor} 
              name={getMetricLabel()}
            />
          </BarChart>
        ) : (
          <AreaChart {...commonProps}>
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={chartColor} stopOpacity={0.8}/>
                <stop offset="95%" stopColor={chartColor} stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="period" 
              tick={{ fontSize: isMobile ? 10 : 12 }}
              angle={isMobile ? -45 : 0}
              textAnchor={isMobile ? 'end' : 'middle'}
              height={isMobile ? 60 : 30}
            />
            <YAxis tick={{ fontSize: isMobile ? 10 : 12 }} />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: theme.palette.background.paper,
                border: `1px solid ${theme.palette.divider}`
              }}
              formatter={(value: any) => [`${value} ${getMetricUnit()}`, getMetricLabel()]}
            />
            <Legend />
            <Area 
              type="monotone" 
              dataKey="value" 
              stroke={chartColor} 
              strokeWidth={2}
              fillOpacity={1} 
              fill="url(#colorValue)"
              name={getMetricLabel()}
            />
          </AreaChart>
        )}
      </ResponsiveContainer>
    );
  };
  
  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      fullScreen={isMobile}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <TrendingUp />
          <Typography variant="h6">{title} - {t.trends.title}</Typography>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        {/* Controls */}
        <Box sx={{ 
          display: 'flex', 
          flexDirection: isMobile ? 'column' : 'row',
          gap: 2, 
          mb: 3,
          justifyContent: 'space-between',
          alignItems: isMobile ? 'stretch' : 'center'
        }}>
          {/* Period Selection */}
          <Box>
            <Typography variant="caption" color="text.secondary" gutterBottom>
              {t.leaderboard.timeRange}
            </Typography>
            <ToggleButtonGroup
              value={period}
              exclusive
              onChange={handlePeriodChange}
              size="small"
              fullWidth={isMobile}
            >
              <ToggleButton value="daily">{t.trends.period.daily}</ToggleButton>
              <ToggleButton value="weekly">{t.trends.period.weekly}</ToggleButton>
              <ToggleButton value="monthly">{t.trends.period.monthly}</ToggleButton>
            </ToggleButtonGroup>
          </Box>
          
          {/* Chart Type Selection */}
          <Box>
            <Typography variant="caption" color="text.secondary" gutterBottom>
              {t.common.filter}
            </Typography>
            <ToggleButtonGroup
              value={chartType}
              exclusive
              onChange={handleChartTypeChange}
              size="small"
              fullWidth={isMobile}
            >
              <ToggleButton value="line">
                <ShowChart sx={{ mr: isMobile ? 0 : 1 }} />
                {!isMobile && t.trends.chartType.line}
              </ToggleButton>
              <ToggleButton value="bar">
                <BarChartIcon sx={{ mr: isMobile ? 0 : 1 }} />
                {!isMobile && t.trends.chartType.bar}
              </ToggleButton>
              <ToggleButton value="area">
                <TrendingUp sx={{ mr: isMobile ? 0 : 1 }} />
                {!isMobile && t.trends.chartType.area}
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>
        </Box>
        
        {/* Chart */}
        <Box sx={{ mt: 2 }}>
          {renderChart()}
        </Box>
        
        {/* Statistics Summary */}
        {!loading && !error && trendData.length > 0 && (
          <Box sx={{ 
            mt: 3, 
            p: 2, 
            bgcolor: 'background.default', 
            borderRadius: 1,
            display: 'flex',
            gap: 3,
            flexWrap: 'wrap'
          }}>
            <Box>
              <Typography variant="caption" color="text.secondary">
                {t.trends.stats.latest}
              </Typography>
              <Typography variant="h6">
                {trendData[trendData.length - 1].value} {getMetricUnit()}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">
                {t.trends.stats.average}
              </Typography>
              <Typography variant="h6">
                {(trendData.reduce((sum, d) => sum + d.value, 0) / trendData.length).toFixed(2)} {getMetricUnit()}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">
                {(metric === 'bestTeiler' || metric === 'avgSpread' || metric === 'avgOffset') ? t.trends.stats.lowest : t.trends.stats.highest}
              </Typography>
              <Typography variant="h6">
                {(metric === 'bestTeiler' || metric === 'avgSpread' || metric === 'avgOffset')
                  ? Math.min(...trendData.map(d => d.value)).toFixed(2)
                  : Math.max(...trendData.map(d => d.value)).toFixed(2)
                } {getMetricUnit()}
              </Typography>
            </Box>
            {trendData.length >= 2 && (
              <Box>
                <Typography variant="caption" color="text.secondary">
                  {t.trends.stats.trend}
                </Typography>
                <Typography 
                  variant="h6" 
                  sx={{ 
                    color: (trendData[trendData.length - 1].value > trendData[0].value) 
                      ? ((metric === 'bestTeiler' || metric === 'avgSpread' || metric === 'avgOffset') ? 'error.main' : 'success.main')
                      : ((metric === 'bestTeiler' || metric === 'avgSpread' || metric === 'avgOffset') ? 'success.main' : 'error.main')
                  }}
                >
                  {trendData[trendData.length - 1].value > trendData[0].value ? '↑' : '↓'} 
                  {' '}
                  {Math.abs(
                    ((trendData[trendData.length - 1].value - trendData[0].value) / trendData[0].value * 100)
                  ).toFixed(1)}%
                </Typography>
              </Box>
            )}
          </Box>
        )}
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose}>{t.common.close}</Button>
      </DialogActions>
    </Dialog>
  );
}

