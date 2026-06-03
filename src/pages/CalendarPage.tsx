// ============================================================
// TREMFYA — Kalendar
// ============================================================

import React, { useState } from 'react';
import {
  Box, Card, CardContent, Typography, IconButton, Stack,
  Chip, Grid,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval,
  isSameMonth, isSameDay, isToday, parseISO, startOfWeek, endOfWeek,
  addMonths, subMonths,
} from 'date-fns';
import { hr } from 'date-fns/locale';
import { useApp } from '../hooks/useApp';
import type { Appointment } from '../types';
import { STATUS_LABELS } from '../types';
import { formatDate } from '../utils/scheduling';

const DOW = ['Pon', 'Uto', 'Sri', 'Čet', 'Pet', 'Sub', 'Ned'];

const STATUS_DOT: Record<string, string> = {
  planned: '#00BCD4',
  confirmed: '#42A5F5',
  completed: '#66BB6A',
  delayed: '#FFB74D',
  skipped: '#EF5350',
};

export default function CalendarPage() {
  const { appointments } = useApp();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  // Include leading/trailing days to fill the grid
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: calStart, end: calEnd });

  const getApptsForDay = (day: Date): Appointment[] =>
    appointments.filter(a => isSameDay(parseISO(a.plannedDate), day));

  const selectedAppts = selectedDay ? getApptsForDay(selectedDay) : [];

  return (
    <Box sx={{ p: 2, pb: 10 }}>
      <Typography variant="h5" fontWeight={800} sx={{ mb: 2 }}>
        Kalendar
      </Typography>

      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ p: 2 }}>
          {/* Month navigation */}
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
            <IconButton onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} size="small">
              <ChevronLeftIcon />
            </IconButton>
            <Typography variant="h6" fontWeight={700} sx={{ textTransform: 'capitalize' }}>
              {format(currentMonth, 'MMMM yyyy', { locale: hr })}
            </Typography>
            <IconButton onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} size="small">
              <ChevronRightIcon />
            </IconButton>
          </Stack>

          {/* Day of week headers */}
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', mb: 1 }}>
            {DOW.map(d => (
              <Typography
                key={d}
                variant="caption"
                align="center"
                sx={{ color: 'text.secondary', fontWeight: 700, py: 0.5 }}
              >
                {d}
              </Typography>
            ))}
          </Box>

          {/* Calendar grid */}
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0.5 }}>
            {days.map(day => {
              const appts = getApptsForDay(day);
              const inMonth = isSameMonth(day, currentMonth);
              const today = isToday(day);
              const isSelected = selectedDay && isSameDay(day, selectedDay);

              return (
                <Box
                  key={day.toISOString()}
                  onClick={() => appts.length > 0 && setSelectedDay(day)}
                  sx={{
                    aspectRatio: '1',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 2,
                    cursor: appts.length > 0 ? 'pointer' : 'default',
                    background: isSelected
                      ? alpha('#00BCD4', 0.2)
                      : today
                      ? alpha('#00BCD4', 0.1)
                      : 'transparent',
                    border: today
                      ? `1px solid ${alpha('#00BCD4', 0.5)}`
                      : `1px solid transparent`,
                    opacity: inMonth ? 1 : 0.3,
                    transition: 'all 0.15s',
                    '&:hover': appts.length > 0 ? {
                      background: alpha('#00BCD4', 0.12),
                    } : {},
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: today ? 800 : inMonth ? 500 : 400,
                      color: today ? '#00BCD4' : 'text.primary',
                      fontSize: '0.8rem',
                    }}
                  >
                    {format(day, 'd')}
                  </Typography>

                  {/* Status dots */}
                  {appts.length > 0 && (
                    <Stack direction="row" spacing={0.3} sx={{ mt: 0.3 }}>
                      {appts.slice(0, 2).map(a => (
                        <Box
                          key={a.id}
                          sx={{
                            width: 6, height: 6, borderRadius: '50%',
                            backgroundColor: STATUS_DOT[a.status] ?? '#00BCD4',
                          }}
                        />
                      ))}
                    </Stack>
                  )}
                </Box>
              );
            })}
          </Box>
        </CardContent>
      </Card>

      {/* Legend */}
      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>Legenda</Typography>
          <Stack direction="row" flexWrap="wrap" gap={1}>
            {Object.entries(STATUS_DOT).map(([status, color]) => (
              <Stack key={status} direction="row" alignItems="center" spacing={0.5}>
                <Box sx={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: color }} />
                <Typography variant="caption" color="text.secondary">
                  {STATUS_LABELS[status as keyof typeof STATUS_LABELS]}
                </Typography>
              </Stack>
            ))}
          </Stack>
        </CardContent>
      </Card>

      {/* Selected day details */}
      {selectedDay && selectedAppts.length > 0 && (
        <Card>
          <CardContent sx={{ p: 2 }}>
            <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5 }}>
              {format(selectedDay, 'EEEE, d. MMMM yyyy.', { locale: hr })}
            </Typography>
            {selectedAppts.map(appt => (
              <Box
                key={appt.id}
                sx={{
                  p: 1.5, borderRadius: 2, mb: 1,
                  background: alpha(STATUS_DOT[appt.status], 0.08),
                  border: `1px solid ${alpha(STATUS_DOT[appt.status], 0.25)}`,
                }}
              >
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2" fontWeight={700}>
                    Injekcija #{appt.index}
                  </Typography>
                  <Chip
                    label={STATUS_LABELS[appt.status]}
                    size="small"
                    sx={{
                      backgroundColor: alpha(STATUS_DOT[appt.status], 0.15),
                      color: STATUS_DOT[appt.status],
                      fontWeight: 700,
                    }}
                  />
                </Stack>
                {appt.actualDate && (
                  <Typography variant="caption" color="text.secondary">
                    Primljeno: {formatDate(appt.actualDate)}
                  </Typography>
                )}
                {appt.notes && (
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                    {appt.notes}
                  </Typography>
                )}
              </Box>
            ))}
          </CardContent>
        </Card>
      )}
    </Box>
  );
}
