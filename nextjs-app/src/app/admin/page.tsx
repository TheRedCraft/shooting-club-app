'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Container,
  Paper,
  Tabs,
  Tab,
  Typography,
  CircularProgress
} from '@mui/material';
import {
  PersonAdd as PersonAddIcon,
  Link as LinkIcon,
  People as PeopleIcon
} from '@mui/icons-material';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import PendingUsersTab from '@/components/admin/PendingUsersTab';
import LinkUsersTab from '@/components/admin/LinkUsersTab';
import UserManagementTab from '@/components/admin/UserManagementTab';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`admin-tabpanel-${index}`}
      aria-labelledby={`admin-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export default function AdminPanel() {
  const router = useRouter();
  const { isAuthenticated, isAdmin, loading } = useAuth();
  const { t } = useLanguage();
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    if (loading) return;

    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }

    if (!isAdmin()) {
      router.push('/dashboard');
      return;
    }
  }, [loading, isAuthenticated, isAdmin, router]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!isAuthenticated() || !isAdmin()) {
    return null;
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        {t.admin.title}
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        {t.admin.linkUsers.description}
      </Typography>

      <Paper sx={{ mt: 3 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          aria-label="admin tabs"
          variant="fullWidth"
        >
          <Tab
            icon={<PersonAddIcon />}
            label={t.admin.tabs.pending}
            id="admin-tab-0"
            aria-controls="admin-tabpanel-0"
          />
          <Tab
            icon={<LinkIcon />}
            label={t.admin.tabs.linkUsers}
            id="admin-tab-1"
            aria-controls="admin-tabpanel-1"
          />
          <Tab
            icon={<PeopleIcon />}
            label={t.admin.tabs.userManagement}
            id="admin-tab-2"
            aria-controls="admin-tabpanel-2"
          />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          <PendingUsersTab />
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <LinkUsersTab />
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <UserManagementTab />
        </TabPanel>
      </Paper>
    </Container>
  );
}

