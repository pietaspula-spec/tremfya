// ============================================================
// TREMFYA — Layout s donjom navigacijom
// ============================================================

import React from 'react';
import { Box, BottomNavigation, BottomNavigationAction, Paper, AppBar, Toolbar, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import HomeIcon from '@mui/icons-material/Home';
import EventNoteIcon from '@mui/icons-material/EventNote';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import TimelineIcon from '@mui/icons-material/Timeline';
import BarChartIcon from '@mui/icons-material/BarChart';
import FavoriteIcon from '@mui/icons-material/Favorite';
import SettingsIcon from '@mui/icons-material/Settings';
import { useNavigate, useLocation } from 'react-router-dom';

const NAV_ITEMS = [
  { label: 'Početna', icon: <HomeIcon />, path: '/' },
  { label: 'Termini', icon: <EventNoteIcon />, path: '/termini' },
  { label: 'Kalendar', icon: <CalendarMonthIcon />, path: '/kalendar' },
  { label: 'Crta', icon: <TimelineIcon />, path: '/crta' },
  { label: 'Više', icon: <BarChartIcon />, path: '/statistika' },
];

interface LayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: LayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const currentIndex = NAV_ITEMS.findIndex(item => item.path === location.pathname);
  const activeIndex = currentIndex >= 0 ? currentIndex : 0;

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: '#0D1B2A',
        pb: 8, // space for bottom nav
      }}
    >
      {/* Content */}
      {children}

      {/* Bottom Navigation */}
      <Paper
        elevation={0}
        sx={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
        }}
      >
        <BottomNavigation
          value={activeIndex}
          onChange={(_, newValue) => navigate(NAV_ITEMS[newValue].path)}
          showLabels
        >
          {NAV_ITEMS.map(item => (
            <BottomNavigationAction
              key={item.path}
              label={item.label}
              icon={item.icon}
              sx={{
                minWidth: 0,
                '& .MuiBottomNavigationAction-label': {
                  fontSize: '0.62rem',
                },
              }}
            />
          ))}
        </BottomNavigation>
      </Paper>
    </Box>
  );
}
