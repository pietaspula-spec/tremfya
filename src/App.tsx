// ============================================================
// TREMFYA — App.tsx (Router + Provider)
// ============================================================

import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline, Box, CircularProgress, Typography } from '@mui/material';
import { AppProvider, useApp } from './hooks/useApp';
import { darkTheme } from './theme';
import AppLayout from './components/layout/AppLayout';
import SetupPage from './pages/SetupPage';
import Dashboard from './pages/Dashboard';
import AppointmentsPage from './pages/AppointmentsPage';
import CalendarPage from './pages/CalendarPage';
import TimelinePage from './pages/TimelinePage';
import StatsPage from './pages/StatsPage';
import DiaryPage from './pages/DiaryPage';
import SettingsPage from './pages/SettingsPage';

function LoadingScreen() {
  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#0D1B2A', gap: 2 }}>
      <CircularProgress sx={{ color: '#00BCD4' }} />
      <Typography color="text.secondary">Učitavanje...</Typography>
    </Box>
  );
}

function InnerApp() {
  const { loading, initialized } = useApp();
  if (loading) return <LoadingScreen />;
  if (!initialized) return <SetupPage />;
  return (
    <HashRouter>
      <AppLayout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/termini" element={<AppointmentsPage />} />
          <Route path="/kalendar" element={<CalendarPage />} />
          <Route path="/crta" element={<TimelinePage />} />
          <Route path="/statistika" element={<StatsPage />} />
          <Route path="/dnevnik" element={<DiaryPage />} />
          <Route path="/postavke" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </AppLayout>
    </HashRouter>
  );
}

export default function App() {
  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <AppProvider>
        <InnerApp />
      </AppProvider>
    </ThemeProvider>
  );
}
