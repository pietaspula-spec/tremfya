// ============================================================
// TREMFYA — Vremenska crta terapije
// ============================================================

import React from 'react';
import { Box, Card, CardContent, Typography, Stack, Chip } from '@mui/material';
import { alpha } from '@mui/material/styles';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import BlockIcon from '@mui/icons-material/Block';
import WarningIcon from '@mui/icons-material/Warning';
import { parseISO, isToday, isPast } from 'date-fns';
import { useApp } from '../hooks/useApp';
import { formatDate, isAppointmentOverdue } from '../utils/scheduling';
import { STATUS_LABELS } from '../types';
import type { AppointmentStatus } from '../types';

const STATUS_COLOR: Record<AppointmentStatus, string> = {
  planned: '#546E7A',
  confirmed: '#42A5F5',
  completed: '#66BB6A',
  delayed: '#FFB74D',
  skipped: '#EF5350',
};

const StatusIcon = ({ status, overdue }: { status: AppointmentStatus; overdue: boolean }) => {
  if (overdue) return <WarningIcon sx={{ color: '#EF5350', fontSize: 22 }} />;
  if (status === 'completed') return <CheckCircleIcon sx={{ color: '#66BB6A', fontSize: 22 }} />;
  if (status === 'skipped') return <BlockIcon sx={{ color: '#EF5350', fontSize: 22 }} />;
  return <RadioButtonUncheckedIcon sx={{ color: STATUS_COLOR[status], fontSize: 22 }} />;
};

export default function TimelinePage() {
  const { appointments } = useApp();

  // Show all completed + next 8 future
  const shown = [
    ...appointments.filter(a => a.status === 'completed' || a.status === 'skipped'),
    ...appointments
      .filter(a => a.status === 'planned' || a.status === 'confirmed' || a.status === 'delayed')
      .slice(0, 8),
  ].sort((a, b) => a.index - b.index);

  return (
    <Box sx={{ p: 2, pb: 10 }}>
      <Typography variant="h5" fontWeight={800} sx={{ mb: 2 }}>
        Vremenska crta
      </Typography>

      <Box sx={{ position: 'relative', pl: 4 }}>
        {/* Vertical line */}
        <Box
          sx={{
            position: 'absolute', left: 20, top: 0, bottom: 0,
            width: 2,
            background: 'linear-gradient(180deg, #00BCD4 0%, rgba(0,188,212,0.1) 100%)',
          }}
        />

        {shown.map((appt, idx) => {
          const overdue = isAppointmentOverdue(appt);
          const today = isToday(parseISO(appt.plannedDate));
          const isFuture = !isPast(parseISO(appt.plannedDate)) && !today;
          const color = overdue ? '#EF5350' : today ? '#66BB6A' : STATUS_COLOR[appt.status];

          return (
            <Box key={appt.id} sx={{ position: 'relative', mb: 2 }}>
              {/* Dot */}
              <Box
                sx={{
                  position: 'absolute', left: -28, top: '50%',
                  transform: 'translateY(-50%)',
                  width: 16, height: 16, borderRadius: '50%',
                  backgroundColor: color,
                  border: `2px solid ${alpha(color, 0.4)}`,
                  boxShadow: today ? `0 0 12px ${alpha('#66BB6A', 0.6)}` : 'none',
                  zIndex: 1,
                }}
              />

              <Card
                sx={{
                  opacity: isFuture ? 0.65 : 1,
                  border: `1px solid ${alpha(color, today ? 0.5 : 0.15)}`,
                  transition: 'opacity 0.2s',
                }}
              >
                <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                  <Stack direction="row" alignItems="center" spacing={1.5}>
                    <StatusIcon status={appt.status} overdue={overdue} />
                    <Box flex={1}>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Typography variant="body2" fontWeight={700}>
                          {formatDate(appt.plannedDate)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Injekcija #{appt.index}
                        </Typography>
                      </Stack>
                      {appt.actualDate && appt.actualDate !== appt.plannedDate && (
                        <Typography variant="caption" color="text.secondary">
                          Primljeno: {formatDate(appt.actualDate)}
                        </Typography>
                      )}
                    </Box>
                    {today && (
                      <Chip
                        label="Danas"
                        size="small"
                        sx={{ backgroundColor: alpha('#66BB6A', 0.15), color: '#66BB6A', fontWeight: 700 }}
                      />
                    )}
                    {overdue && (
                      <Chip
                        label="Kasni"
                        size="small"
                        sx={{ backgroundColor: alpha('#EF5350', 0.15), color: '#EF5350', fontWeight: 700 }}
                      />
                    )}
                    {!today && !overdue && isFuture && (
                      <Chip
                        label={STATUS_LABELS[appt.status]}
                        size="small"
                        sx={{ backgroundColor: alpha(color, 0.1), color, fontWeight: 600, fontSize: '0.65rem' }}
                      />
                    )}
                  </Stack>
                </CardContent>
              </Card>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
