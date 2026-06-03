// ============================================================
// TREMFYA — Dashboard (Početni zaslon)
// ============================================================

import React, { useState } from 'react';
import {
  Box, Card, CardContent, Typography, Button, LinearProgress,
  Chip, Dialog, DialogTitle, DialogContent, DialogActions,
  FormControlLabel, Radio, RadioGroup, Stack, Divider,
  IconButton, Tooltip,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import EventIcon from '@mui/icons-material/Event';
import TodayIcon from '@mui/icons-material/Today';
import MedicalServicesIcon from '@mui/icons-material/MedicalServices';
import TimelineIcon from '@mui/icons-material/Timeline';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import { format, parseISO } from 'date-fns';
import { hr } from 'date-fns/locale';
import { useApp } from '../hooks/useApp';
import {
  getDaysUntil, getDaysSince, getProgressPercent,
  isAppointmentToday, isAppointmentOverdue, calculateStats,
  formatDate,
} from '../utils/scheduling';

// ── Status Banner ─────────────────────────────────────────────

interface StatusBannerProps {
  onMarkDone: () => void;
}

function StatusBanner({ onMarkDone }: StatusBannerProps) {
  const { nextAppointment } = useApp();
  if (!nextAppointment) return null;

  const isToday = isAppointmentToday(nextAppointment);
  const isOverdue = isAppointmentOverdue(nextAppointment);
  const daysUntil = getDaysUntil(nextAppointment.plannedDate);
  const overdueDays = isOverdue ? getDaysSince(nextAppointment.plannedDate) : 0;

  if (!isToday && !isOverdue) return null;

  return (
    <Card
      sx={{
        mb: 2,
        background: isOverdue
          ? 'linear-gradient(135deg, rgba(239,83,80,0.15) 0%, rgba(239,83,80,0.05) 100%)'
          : 'linear-gradient(135deg, rgba(102,187,106,0.15) 0%, rgba(102,187,106,0.05) 100%)',
        border: `1px solid ${isOverdue ? 'rgba(239,83,80,0.4)' : 'rgba(102,187,106,0.4)'}`,
      }}
    >
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          {isOverdue
            ? <WarningAmberIcon sx={{ color: '#EF5350', fontSize: 28 }} />
            : <CheckCircleIcon sx={{ color: '#66BB6A', fontSize: 28 }} />}
          <Box flex={1}>
            <Typography variant="subtitle1" fontWeight={700}>
              {isOverdue
                ? `Injekcija kasni ${overdueDays} ${overdueDays === 1 ? 'dan' : overdueDays < 5 ? 'dana' : 'dana'}`
                : 'Danas je planirana injekcija'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Planirano: {formatDate(nextAppointment.plannedDate)}
            </Typography>
          </Box>
          <Button
            variant="contained"
            size="small"
            color={isOverdue ? 'error' : 'success'}
            onClick={onMarkDone}
            sx={{ whiteSpace: 'nowrap', borderRadius: 10 }}
          >
            Označi primljeno
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
}

// ── Hero Card ─────────────────────────────────────────────────

function HeroCard() {
  const { nextAppointment, lastCompleted } = useApp();
  if (!nextAppointment) return null;

  const daysUntil = getDaysUntil(nextAppointment.plannedDate);
  const progress = lastCompleted
    ? getProgressPercent(lastCompleted, nextAppointment)
    : 0;

  const isOverdue = isAppointmentOverdue(nextAppointment);
  const isToday = isAppointmentToday(nextAppointment);

  let heroText = '';
  let heroColor = '#00BCD4';

  if (isOverdue) {
    const d = getDaysSince(nextAppointment.plannedDate);
    heroText = `Kasni ${d} ${d === 1 ? 'dan' : 'dana'}`;
    heroColor = '#EF5350';
  } else if (isToday) {
    heroText = 'Danas!';
    heroColor = '#66BB6A';
  } else {
    heroText = `Za ${daysUntil} ${daysUntil === 1 ? 'dan' : daysUntil < 5 ? 'dana' : 'dana'}`;
  }

  return (
    <Card
      sx={{
        mb: 2,
        background: 'linear-gradient(135deg, #112240 0%, #1A3A5C 100%)',
        border: `1px solid ${alpha('#00BCD4', 0.2)}`,
        overflow: 'visible',
        position: 'relative',
      }}
    >
      {/* Decorative circle */}
      <Box
        sx={{
          position: 'absolute', top: -20, right: -20,
          width: 120, height: 120, borderRadius: '50%',
          background: alpha('#00BCD4', 0.06),
          pointerEvents: 'none',
        }}
      />
      <CardContent sx={{ p: 3 }}>
        <Typography variant="overline" sx={{ color: '#90A4AE', letterSpacing: 2 }}>
          Sljedeća injekcija
        </Typography>

        <Typography
          variant="h3"
          sx={{
            color: heroColor,
            fontWeight: 800,
            lineHeight: 1.1,
            my: 1,
            textShadow: `0 0 30px ${alpha(heroColor, 0.4)}`,
          }}
        >
          {heroText}
        </Typography>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
          {format(parseISO(nextAppointment.plannedDate), 'EEEE, d. MMMM yyyy.', { locale: hr })}
        </Typography>

        {/* Progress bar */}
        {lastCompleted && (
          <Box>
            <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
              <Typography variant="caption" color="text.secondary">
                Od zadnje: {getDaysSince(lastCompleted.actualDate ?? lastCompleted.plannedDate)} dana
              </Typography>
              <Typography variant="caption" sx={{ color: '#00BCD4' }}>
                {progress}%
              </Typography>
            </Stack>
            <LinearProgress
              variant="determinate"
              value={progress}
              sx={{ '& .MuiLinearProgress-bar': { background: `linear-gradient(90deg, #00BCD4, ${heroColor})` } }}
            />
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

// ── Stats Row ─────────────────────────────────────────────────

function StatsRow() {
  const { appointments, config } = useApp();
  if (!config) return null;

  const stats = calculateStats(appointments);
  const completed = appointments.filter(a => a.status === 'completed');
  const daysSinceStart = stats.therapyDurationDays;

  const items = [
    {
      icon: <MedicalServicesIcon />,
      label: 'Primljeno',
      value: stats.totalReceived,
      color: '#00BCD4',
    },
    {
      icon: <EventIcon />,
      label: 'Odgođeno',
      value: stats.totalDelayed + stats.totalSkipped,
      color: stats.totalDelayed + stats.totalSkipped > 0 ? '#FFB74D' : '#66BB6A',
    },
    {
      icon: <TimelineIcon />,
      label: 'Terapija',
      value: `${stats.therapyDurationMonths}mj`,
      color: '#80CBC4',
    },
    {
      icon: <CheckCircleIcon />,
      label: 'Na vrijeme',
      value: `${stats.onTimePercentage}%`,
      color: stats.onTimePercentage >= 80 ? '#66BB6A' : '#FFB74D',
    },
  ];

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 1,
        mb: 2,
      }}
    >
      {items.map(item => (
        <Card key={item.label} sx={{ p: 1.5, textAlign: 'center' }}>
          <Box sx={{ color: item.color, mb: 0.5, '& svg': { fontSize: 20 } }}>
            {item.icon}
          </Box>
          <Typography
            variant="h6"
            sx={{ color: item.color, fontWeight: 700, fontSize: '1.1rem' }}
          >
            {item.value}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
            {item.label}
          </Typography>
        </Card>
      ))}
    </Box>
  );
}

// ── Upcoming List ─────────────────────────────────────────────

function UpcomingAppointments() {
  const { appointments } = useApp();

  const upcoming = appointments
    .filter(a => a.status === 'planned' || a.status === 'confirmed' || a.status === 'delayed')
    .slice(0, 4);

  return (
    <Card sx={{ mb: 2 }}>
      <CardContent sx={{ p: 2 }}>
        <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5 }}>
          Nadolazeći termini
        </Typography>
        <Stack spacing={1}>
          {upcoming.map(appt => {
            const days = getDaysUntil(appt.plannedDate);
            const overdue = isAppointmentOverdue(appt);
            return (
              <Box
                key={appt.id}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  p: 1.5,
                  borderRadius: 2,
                  background: alpha('#00BCD4', 0.05),
                  border: `1px solid ${alpha('#00BCD4', 0.08)}`,
                }}
              >
                <Box
                  sx={{
                    width: 36, height: 36, borderRadius: '50%',
                    background: alpha('#00BCD4', 0.12),
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    mr: 1.5, flexShrink: 0,
                  }}
                >
                  <Typography variant="caption" sx={{ color: '#00BCD4', fontWeight: 700 }}>
                    #{appt.index}
                  </Typography>
                </Box>
                <Box flex={1}>
                  <Typography variant="body2" fontWeight={600}>
                    {formatDate(appt.plannedDate)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {format(parseISO(appt.plannedDate), 'EEEE', { locale: hr })}
                  </Typography>
                </Box>
                <Chip
                  label={
                    overdue
                      ? `Kasni ${getDaysSince(appt.plannedDate)}d`
                      : isAppointmentToday(appt)
                      ? 'Danas'
                      : `Za ${days}d`
                  }
                  size="small"
                  sx={{
                    backgroundColor: alpha(
                      overdue ? '#EF5350' : isAppointmentToday(appt) ? '#66BB6A' : '#00BCD4',
                      0.15
                    ),
                    color: overdue ? '#EF5350' : isAppointmentToday(appt) ? '#66BB6A' : '#00BCD4',
                    fontWeight: 700,
                    fontSize: '0.7rem',
                  }}
                />
              </Box>
            );
          })}
        </Stack>
      </CardContent>
    </Card>
  );
}

// ── Mark Completed Dialog ─────────────────────────────────────

interface MarkDoneDialogProps {
  open: boolean;
  onClose: () => void;
}

function MarkDoneDialog({ open, onClose }: MarkDoneDialogProps) {
  const { nextAppointment, markCompleted, config } = useApp();
  const [reschedule, setReschedule] = useState('keep');
  const [saving, setSaving] = useState(false);
  const [actualDate, setActualDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  if (!nextAppointment) return null;

  const actualDateObj = new Date(actualDate);
  const plannedDateObj = parseISO(nextAppointment.plannedDate);
  const diff = Math.round((actualDateObj.getTime() - plannedDateObj.getTime()) / 86400000);
  const hasDiff = diff !== 0;

  const handleConfirm = async () => {
    setSaving(true);
    await markCompleted(
      nextAppointment.id,
      actualDateObj,
      hasDiff && reschedule === 'adjust'
    );
    setSaving(false);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Označi injekciju kao primljenu</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Injekcija #{nextAppointment.index} — Planirano: {formatDate(nextAppointment.plannedDate)}
        </Typography>

        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          Stvarni datum primjene
        </Typography>
        <TextField
          type="date"
          fullWidth
          value={actualDate}
          onChange={e => setActualDate(e.target.value)}
          sx={{ mb: 2 }}
        />

        {hasDiff && (
          <>
            <Box
              sx={{
                p: 1.5, borderRadius: 2, mb: 2,
                background: alpha(diff > 0 ? '#FFB74D' : '#42A5F5', 0.1),
                border: `1px solid ${alpha(diff > 0 ? '#FFB74D' : '#42A5F5', 0.3)}`,
              }}
            >
              <Typography variant="body2">
                Odstupanje: {diff > 0 ? '+' : ''}{diff} dana od plana
              </Typography>
            </Box>

            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Prilagodi raspored?
            </Typography>
            <RadioGroup value={reschedule} onChange={e => setReschedule(e.target.value)}>
              <FormControlLabel
                value="keep"
                control={<Radio />}
                label="Zadrži postojeći raspored"
              />
              <FormControlLabel
                value="adjust"
                control={<Radio />}
                label="Prilagodi raspored stvarnom datumu"
              />
            </RadioGroup>
          </>
        )}
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} color="inherit">Odustani</Button>
        <Button variant="contained" onClick={handleConfirm} disabled={saving}>
          {saving ? 'Spremam...' : 'Potvrdi'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ── Main Dashboard ────────────────────────────────────────────

export default function Dashboard() {
  const [markDoneOpen, setMarkDoneOpen] = useState(false);

  return (
    <Box sx={{ p: 2, pb: 10 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Box>
          <Typography variant="h5" fontWeight={800}>
            Tremfya
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Praćenje terapije
          </Typography>
        </Box>
        <Tooltip title="Podsjetnici">
          <IconButton size="small">
            <NotificationsNoneIcon />
          </IconButton>
        </Tooltip>
      </Stack>

      <StatusBanner onMarkDone={() => setMarkDoneOpen(true)} />
      <HeroCard />
      <StatsRow />
      <UpcomingAppointments />
      <MarkDoneDialog open={markDoneOpen} onClose={() => setMarkDoneOpen(false)} />
    </Box>
  );
}
