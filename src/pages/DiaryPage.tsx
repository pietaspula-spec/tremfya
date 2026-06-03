// ============================================================
// TREMFYA — Dnevnik nuspojava
// ============================================================

import React, { useState } from 'react';
import {
  Box, Card, CardContent, Typography, Stack, Slider,
  Switch, FormControlLabel, TextField, Button, Dialog,
  DialogTitle, DialogContent, DialogActions, Chip,
  Select, MenuItem, FormControl, InputLabel, Divider,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import FavoriteIcon from '@mui/icons-material/Favorite';
import SentimentVeryDissatisfiedIcon from '@mui/icons-material/SentimentVeryDissatisfied';
import { useApp } from '../hooks/useApp';
import type { Appointment, SideEffect } from '../types';
import { formatDate } from '../utils/scheduling';

// ── Side effect entry form ────────────────────────────────────

interface SideEffectFormProps {
  initial?: SideEffect;
  onSave: (se: SideEffect) => void;
  onCancel: () => void;
}

function SideEffectForm({ initial, onSave, onCancel }: SideEffectFormProps) {
  const [pain, setPain] = useState(initial?.painLevel ?? 0);
  const [redness, setRedness] = useState(initial?.redness ?? false);
  const [swelling, setSwelling] = useState(initial?.swelling ?? false);
  const [fatigue, setFatigue] = useState(initial?.fatigue ?? 0);
  const [headache, setHeadache] = useState(initial?.headache ?? 0);
  const [other, setOther] = useState(initial?.other ?? '');

  const sliderSx = { color: '#00BCD4' };
  const markLabel = (v: number) => v === 0 ? 'Nema' : v <= 3 ? 'Blago' : v <= 6 ? 'Umjereno' : 'Jako';

  return (
    <Stack spacing={2.5}>
      {/* Pain */}
      <Box>
        <Stack direction="row" justifyContent="space-between">
          <Typography variant="subtitle2">Bol na mjestu uboda</Typography>
          <Typography variant="subtitle2" sx={{ color: '#00BCD4' }}>{pain}/10 — {markLabel(pain)}</Typography>
        </Stack>
        <Slider value={pain} onChange={(_, v) => setPain(v as number)} min={0} max={10} step={1} sx={sliderSx} />
      </Box>

      {/* Fatigue */}
      <Box>
        <Stack direction="row" justifyContent="space-between">
          <Typography variant="subtitle2">Umor</Typography>
          <Typography variant="subtitle2" sx={{ color: '#00BCD4' }}>{fatigue}/10 — {markLabel(fatigue)}</Typography>
        </Stack>
        <Slider value={fatigue} onChange={(_, v) => setFatigue(v as number)} min={0} max={10} step={1} sx={sliderSx} />
      </Box>

      {/* Headache */}
      <Box>
        <Stack direction="row" justifyContent="space-between">
          <Typography variant="subtitle2">Glavobolja</Typography>
          <Typography variant="subtitle2" sx={{ color: '#00BCD4' }}>{headache}/10 — {markLabel(headache)}</Typography>
        </Stack>
        <Slider value={headache} onChange={(_, v) => setHeadache(v as number)} min={0} max={10} step={1} sx={sliderSx} />
      </Box>

      <Stack direction="row" spacing={2}>
        <FormControlLabel
          control={<Switch checked={redness} onChange={e => setRedness(e.target.checked)} color="primary" />}
          label="Crvenilo"
        />
        <FormControlLabel
          control={<Switch checked={swelling} onChange={e => setSwelling(e.target.checked)} color="primary" />}
          label="Oteklina"
        />
      </Stack>

      <TextField
        label="Ostale nuspojave (slobodan unos)"
        fullWidth multiline rows={2}
        size="small"
        value={other}
        onChange={e => setOther(e.target.value)}
        placeholder="Npr. svrbež, bol u zglobovima..."
      />

      <Stack direction="row" spacing={1} justifyContent="flex-end">
        <Button onClick={onCancel} color="inherit">Odustani</Button>
        <Button
          variant="contained"
          onClick={() => onSave({ painLevel: pain, redness, swelling, fatigue, headache, other })}
        >
          Spremi nuspojave
        </Button>
      </Stack>
    </Stack>
  );
}

// ── Side effect summary card ──────────────────────────────────

function SideEffectCard({ appt }: { appt: Appointment }) {
  const [open, setOpen] = useState(false);
  const { updateAppointment } = useApp();
  const se = appt.sideEffects;

  const handleSave = async (sideEffects: SideEffect) => {
    await updateAppointment({ ...appt, sideEffects });
    setOpen(false);
  };

  const severity = se
    ? Math.round((se.painLevel + se.fatigue + se.headache) / 3)
    : null;

  const severityColor =
    severity === null ? '#90A4AE'
      : severity <= 3 ? '#66BB6A'
      : severity <= 6 ? '#FFB74D'
      : '#EF5350';

  return (
    <>
      <Card sx={{ mb: 1.5 }}>
        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Box
              sx={{
                width: 44, height: 44, borderRadius: '50%',
                background: alpha(severityColor, 0.12),
                border: `2px solid ${alpha(severityColor, 0.4)}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Typography variant="body2" fontWeight={800} sx={{ color: severityColor }}>
                #{appt.index}
              </Typography>
            </Box>

            <Box flex={1}>
              <Typography variant="body2" fontWeight={700}>
                {formatDate(appt.actualDate ?? appt.plannedDate)}
              </Typography>
              {se ? (
                <Stack direction="row" flexWrap="wrap" gap={0.5} sx={{ mt: 0.5 }}>
                  {se.painLevel > 0 && <Chip label={`Bol: ${se.painLevel}/10`} size="small" sx={{ fontSize: '0.65rem', height: 20 }} />}
                  {se.fatigue > 0 && <Chip label={`Umor: ${se.fatigue}/10`} size="small" sx={{ fontSize: '0.65rem', height: 20 }} />}
                  {se.redness && <Chip label="Crvenilo" size="small" sx={{ fontSize: '0.65rem', height: 20 }} />}
                  {se.swelling && <Chip label="Oteklina" size="small" sx={{ fontSize: '0.65rem', height: 20 }} />}
                </Stack>
              ) : (
                <Typography variant="caption" color="text.secondary">
                  Nuspojave nisu evidentirane
                </Typography>
              )}
            </Box>

            <Button
              size="small"
              variant={se ? 'outlined' : 'contained'}
              onClick={() => setOpen(true)}
              sx={{ fontSize: '0.7rem', borderRadius: 8, whiteSpace: 'nowrap' }}
            >
              {se ? 'Uredi' : 'Dodaj'}
            </Button>
          </Stack>
        </CardContent>
      </Card>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Nuspojave — Injekcija #{appt.index}</DialogTitle>
        <DialogContent>
          <SideEffectForm initial={appt.sideEffects} onSave={handleSave} onCancel={() => setOpen(false)} />
        </DialogContent>
      </Dialog>
    </>
  );
}

// ── Main ──────────────────────────────────────────────────────

export default function DiaryPage() {
  const { appointments } = useApp();
  const completed = appointments.filter(a => a.status === 'completed').reverse();

  return (
    <Box sx={{ p: 2, pb: 10 }}>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
        <FavoriteIcon sx={{ color: '#EF5350' }} />
        <Typography variant="h5" fontWeight={800}>Dnevnik nuspojava</Typography>
      </Stack>

      {completed.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <SentimentVeryDissatisfiedIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
          <Typography color="text.secondary">
            Nema evidentiranih primljenih injekcija.
          </Typography>
        </Box>
      ) : (
        completed.map(appt => <SideEffectCard key={appt.id} appt={appt} />)
      )}
    </Box>
  );
}
