// ============================================================
// TREMFYA — Material UI tema (Medical Dark)
// ============================================================

import { createTheme, alpha } from '@mui/material/styles';

const TEAL = '#00BCD4';
const BLUE_DARK = '#1565C0';
const SURFACE = '#0D1B2A';
const SURFACE2 = '#112240';
const SURFACE3 = '#1A3A5C';

export const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: TEAL, light: '#4DD0E1', dark: '#00838F', contrastText: '#000' },
    secondary: { main: '#80CBC4', light: '#B2DFDB', dark: '#4DB6AC' },
    error: { main: '#EF5350' },
    warning: { main: '#FFB74D' },
    success: { main: '#66BB6A' },
    info: { main: '#42A5F5' },
    background: { default: SURFACE, paper: SURFACE2 },
    text: { primary: '#E8F4F8', secondary: '#90A4AE' },
    divider: alpha(TEAL, 0.12),
  },
  typography: {
    fontFamily: '"Nunito", "Roboto", sans-serif',
    h4: { fontWeight: 700, letterSpacing: '-0.5px' },
    h5: { fontWeight: 700 },
    h6: { fontWeight: 600 },
    subtitle1: { fontWeight: 500 },
    button: { fontWeight: 600, letterSpacing: '0.5px' },
  },
  shape: { borderRadius: 16 },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          background: SURFACE2,
          border: `1px solid ${alpha(TEAL, 0.1)}`,
          boxShadow: `0 4px 24px ${alpha('#000', 0.3)}`,
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          textTransform: 'none',
          padding: '10px 20px',
        },
        contained: {
          boxShadow: `0 4px 16px ${alpha(TEAL, 0.3)}`,
          '&:hover': { boxShadow: `0 6px 20px ${alpha(TEAL, 0.45)}` },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { borderRadius: 8, fontWeight: 600 },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: { borderRadius: 8, height: 8, backgroundColor: alpha(TEAL, 0.15) },
        bar: { borderRadius: 8 },
      },
    },
    MuiBottomNavigation: {
      styleOverrides: {
        root: {
          background: alpha(SURFACE2, 0.95),
          backdropFilter: 'blur(20px)',
          borderTop: `1px solid ${alpha(TEAL, 0.15)}`,
          height: 64,
        },
      },
    },
    MuiBottomNavigationAction: {
      styleOverrides: {
        root: { '&.Mui-selected': { color: TEAL } },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: alpha(SURFACE2, 0.92),
          backdropFilter: 'blur(20px)',
          borderBottom: `1px solid ${alpha(TEAL, 0.12)}`,
          boxShadow: 'none',
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: { background: SURFACE2, borderRadius: 20 },
      },
    },
    MuiFab: {
      styleOverrides: {
        root: { borderRadius: 16 },
      },
    },
    MuiTextField: {
      defaultProps: { variant: 'outlined', size: 'small' },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          margin: '2px 8px',
          '&.Mui-selected': { backgroundColor: alpha(TEAL, 0.12) },
        },
      },
    },
  },
});

export const lightTheme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: BLUE_DARK, light: '#5E92F3', dark: '#003c8f', contrastText: '#fff' },
    secondary: { main: '#00BCD4' },
    background: { default: '#F0F4F8', paper: '#FFFFFF' },
  },
  typography: { fontFamily: '"Nunito", "Roboto", sans-serif' },
  shape: { borderRadius: 16 },
});
