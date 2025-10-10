'use client';

import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Tabs,
  Tab,
  Alert
} from '@mui/material';
import { useAppSelector } from '@/redux/hooks';
import BlogEditor from './cms/BlogEditor';
import FAQEditor from './cms/FAQEditor';
import RegulaminEditor from './cms/RegulaminEditor';

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
      id={`cms-tabpanel-${index}`}
      aria-labelledby={`cms-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

export default function ContentManagementPanel() {
  const { user } = useAppSelector((state) => state.auth);
  const [currentTab, setCurrentTab] = useState(0);

  // Check if user is admin
  const isAdmin = user?.email?.includes('@universemapmaker.online') || user?.username === 'admin';

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  if (!isAdmin) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          Nie masz uprawnień do zarządzania treścią. Tylko administratorzy mają dostęp.
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 3, fontWeight: 600 }}>
        Zarządzanie Treścią (CMS)
      </Typography>

      <Paper sx={{ width: '100%' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={currentTab}
            onChange={handleTabChange}
            aria-label="CMS tabs"
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab label="📝 Blog" />
            <Tab label="❓ FAQ" />
            <Tab label="📄 Regulamin" />
          </Tabs>
        </Box>

        <TabPanel value={currentTab} index={0}>
          <BlogEditor />
        </TabPanel>

        <TabPanel value={currentTab} index={1}>
          <FAQEditor />
        </TabPanel>

        <TabPanel value={currentTab} index={2}>
          <RegulaminEditor />
        </TabPanel>
      </Paper>

      <Alert severity="info" sx={{ mt: 3 }}>
        <Typography variant="body2">
          <strong>Uwaga:</strong> Zmiany są zapisywane lokalnie w plikach JSON.
          W produkcji dane będą synchronizowane z bazą danych PostgreSQL.
        </Typography>
      </Alert>
    </Box>
  );
}
