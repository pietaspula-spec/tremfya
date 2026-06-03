// ============================================================
// TREMFYA — Početno postavljanje (Setup)
// ============================================================

import React, { useState } from 'react';
import {
  Box, Button, Card, CardContent, Typography, TextField,
  InputAdornment, Slider, Alert, CircularProgress,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import MedicalServicesIcon from '@mui/icons-material/MedicalServices';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import { format } from 'date-fns';
import { useApp } from '../hooks/useApp';
import type { TherapyConfig } from '../types';

export default function SetupPage() {
  const { saveConfig } = useApp();
  const [firstDate, setFirstDate] = useState<string>(
    format(new Date(), "yyyy-MM-dd")
  );
  const [intervalWeeks, setIntervalWeeks] = useState(8);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!firstDate) { setError('Unesite datum prve injekcije.'); return; }
    setSaving(true);
    setError('');
    try {
      const config: TherapyConfig = {
        firstInjectionDate: new Date(firstDate).toISOString(),
        intervalWeeks,
        showFutureCount: 12,
        reminderDays: [1, 3, 7, 14],
        notificationsEnabled: false,
        darkMode: true,
      };
      await saveConfig(config);
    } catch (e) {
      setError('Greška pri spremanju. Pokušajte ponovo.');
      setSaving(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(160deg, #0D1B2A 0%, #112240 60%, #0a3d62 100%)',
        p: 2,
      }}
    >
      <Box sx={{ width: '100%', maxWidth: 480 }}>
        {/* Logo / Header */}
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Box
            sx={{
              width: 80, height: 80, borderRadius: '50%',
              background: 'linear-gradient(135deg, #00BCD4 0%, #1565C0 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              mx: 'auto', mb: 2,
              boxShadow: '0 8px 32px rgba(0,188,212,0.4)',
            }}
          >
            <MedicalServicesIcon sx={{ fontSize: 40, color: '#fff' }} />
          </Box>
          <Typography variant="h4" sx={{ color: '#E8F4F8', mb: 0.5 }}>
            Tremfya
          </Typography>
          <Typography variant="body1" sx={{ color: '#90A4AE' }}>
            Praćenje biološke terapije
          </Typography>
        </Box>

        <Card>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 0.5 }}>
              Početno postavljanje
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Unesite podatke o svojoj terapiji kako biste pokrenuli aplikaciju.
            </Typography>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            {/* Datum prve injekcije */}
            <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary' }}>
              Datum prve injekcije
            </Typography>
            <TextField
              fullWidth
              type="date"
              value={firstDate}
              onChange={e => setFirstDate(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <CalendarTodayIcon fontSize="small" />
                  </InputAdornment>
                ),
              }}
              sx={{ mb: 3 }}
            />

            {/* Interval terapije */}
            <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary' }}>
              Interval između injekcija
            </Typography>
            <Box
              sx={{
                p: 2, borderRadius: 3,
                background: alpha('#00BCD4', 0.08),
                border: `1px solid ${alpha('#00BCD4', 0.2)}`,
                mb: 1,
              }}
            >
              <Typography variant="h5" align="center" sx={{ color: '#00BCD4', mb: 1 }}>
                {intervalWeeks} tjedana
              </Typography>
              <Slider
                value={intervalWeeks}
                onChange={(_, v) => setIntervalWeeks(v as number)}
                min={2} max={12} step={1}
                marks={[
                  { value: 4, label: '4t' },
                  { value: 8, label: '8t' },
                  { value: 12, label: '12t' },
                ]}
                sx={{ color: '#00BCD4' }}
              />
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 3, display: 'block' }}>
              Standardni Tremfya interval je 8 tjedana (q8w). Prilagodite prema uputama vašeg liječnika.
            </Typography>

            <Button
              fullWidth
              variant="contained"
              size="large"
              onClick={handleSubmit}
              disabled={saving || !firstDate}
              sx={{
                py: 1.5,
                background: 'linear-gradient(135deg, #00BCD4 0%, #1565C0 100%)',
                fontSize: '1rem',
              }}
            >
              {saving ? <CircularProgress size={24} color="inherit" /> : 'Pokreni aplikaciju →'}
            </Button>
          </CardContent>
        </Card>

        <Typography variant="caption" align="center" sx={{ display: 'block', mt: 2, color: '#546E7A' }}>
          Svi podaci ostaju lokalno na vašem uređaju.
        </Typography>
      </Box>
    </Box>
  );
}
