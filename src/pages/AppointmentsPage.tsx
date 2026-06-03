// ============================================================
// TREMFYA — Popis termina
// ============================================================

import React, { useState } from 'react';
import {
  Box, Card, CardContent, CardActionArea, Typography, Chip,
  Stack, Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Select, MenuItem, FormControl,
  InputLabel, Divider, RadioGroup, FormControlLabel, Radio,
  Tabs, Tab, IconButton, Collapse,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import WarningIcon from '@mui/icons-material/Warning';
import BlockIcon from '@mui/icons-material/Block';
import ScheduleIcon from '@mui/icons-material/Schedule';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { format, parseISO } from 'date-fns';
import { hr } from 'date-fns/locale';
import { useApp } from '../hooks/useApp';
import {
  getDaysUntil, getDaysSince, getDeviationDays, isAppointmentOverdue,
  formatDate,
} from '../utils/scheduling';
import type { Appointment, AppointmentStatus, InjectionSite } from '../types';
import { STATUS_LABELS, INJECTION_SITE_LABELS } from '../types';

// ── Status helpers ────────────────────────────────────────────

const STATUS_COLOR: Record<AppointmentStatus, string> = {
  planned: '#00BCD4',
  confirmed: '#42A5F5',
  completed: '#66BB6A',
  delayed: '#FFB74D',
  skipped: '#EF5350',
};

const STATUS_ICON: Record<AppointmentStatus, React.ReactNode> = {
  planned: <RadioButtonUncheckedIcon fontSize="small" />,
  confirmed: <ScheduleIcon fontSize="small" />,
  completed: <CheckCircleIcon fontSize="small" />,
  delayed: <WarningIcon fontSize="small" />,
  skipped: <BlockIcon fontSize="small" />,
};

// ── Appointment Card ──────────────────────────────────────────

interface ApptCardProps {
  appt: Appointment;
  onClick: () => void;
}

function ApptCard({ appt, onClick }: ApptCardProps) {
  const isOverdue = isAppointmentOverdue(appt);
  const days = getDaysUntil(appt.plannedDate);
  const color = STATUS_COLOR[appt.status];
  const isPast = appt.status === 'completed' || appt.status === 'skipped';

  return (
    <Card
      sx={{
        mb: 1.5,
        opacity: isPast ? 0.75 : 1,
        border: `1px solid ${alpha(color, isOverdue ? 0.5 : 0.15)}`,
        transition: 'all 0.2s',
        '&:hover': { border: `1px solid ${alpha(color, 0.4)}`, transform: 'translateY(-1px)' },
      }}
    >
      <CardActionArea onClick={onClick} sx={{ borderRadius: 2 }}>
        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
          <Stack direction="row" alignItems="center" spacing={1.5}>
            {/* Index bubble */}
            <Box
              sx={{
                width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
                background: `linear-gradient(135deg, ${alpha(color, 0.2)}, ${alpha(color, 0.1)})`,
                border: `2px solid ${alpha(color, 0.4)}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <Typography variant="body2" fontWeight={800} sx={{ color }}>
                #{appt.index}
              </Typography>
            </Box>

            <Box flex={1} minWidth={0}>
              {/* Dates */}
              <Typography variant="body1" fontWeight={700} noWrap>
                {formatDate(appt.plannedDate)}
              </Typography>
              {appt.actualDate && appt.actualDate !== appt.plannedDate && (
                <Typography variant="caption" color="text.secondary">
                  Primljeno: {formatDate(appt.actualDate)}
                  {' '}
                  <span style={{ color: getDeviationDays(appt.plannedDate, appt.actualDate) > 0 ? '#FFB74D' : '#42A5F5' }}>
                    ({getDeviationDays(appt.plannedDate, appt.actualDate) > 0 ? '+' : ''}{getDeviationDays(appt.plannedDate, appt.actualDate)}d)
                  </span>
                </Typography>
              )}
              {appt.injectionSite && (
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                  📍 {INJECTION_SITE_LABELS[appt.injectionSite]}
                </Typography>
              )}
            </Box>

            {/* Status chip */}
            <Chip
              icon={STATUS_ICON[appt.status] as any}
              label={
                isOverdue
                  ? `Kasni ${getDaysSince(appt.plannedDate)}d`
                  : appt.status === 'planned' || appt.status === 'confirmed'
                  ? days >= 0
                    ? `Za ${days}d`
                    : STATUS_LABELS[appt.status]
                  : STATUS_LABELS[appt.status]
              }
              size="small"
              sx={{
                backgroundColor: alpha(isOverdue ? '#EF5350' : color, 0.12),
                color: isOverdue ? '#EF5350' : color,
                fontWeight: 700,
                fontSize: '0.7rem',
                '& .MuiChip-icon': { color: 'inherit' },
              }}
            />
          </Stack>

          {/* Notes preview */}
          {appt.notes && (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{
                mt: 1, display: 'block',
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}
            >
              💬 {appt.notes}
            </Typography>
          )}
        </CardContent>
      </CardActionArea>
    </Card>
  );
}

// ── Detail / Edit Dialog ──────────────────────────────────────

interface DetailDialogProps {
  appt: Appointment | null;
  onClose: () => void;
}

function DetailDialog({ appt, onClose }: DetailDialogProps) {
  const { updateAppointment, config } = useApp();
  const [editing, setEditing] = useState(false);
  const [status, setStatus] = useState<AppointmentStatus>(appt?.status ?? 'planned');
  const [notes, setNotes] = useState(appt?.notes ?? '');
  const [actualDate, setActualDate] = useState(
    appt?.actualDate ? format(parseISO(appt.actualDate), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd')
  );
  const [site, setSite] = useState<InjectionSite | ''>(appt?.injectionSite ?? '');
  const [reschedule, setReschedule] = useState('keep');
  const [saving, setSaving] = useState(false);

  if (!appt) return null;

  const deviation = appt.actualDate
    ? getDeviationDays(appt.plannedDate, appt.actualDate)
    : null;

  const handleSave = async () => {
    setSaving(true);
    const updated: Appointment = {
      ...appt,
      status,
      notes,
      actualDate: status === 'completed' ? new Date(actualDate).toISOString() : appt.actualDate,
      injectionSite: site || undefined,
    };
    const newRefDate = reschedule === 'adjust' && status === 'completed'
      ? new Date(actualDate) : undefined;
    await updateAppointment(updated, !!newRefDate, newRefDate);
    setSaving(false);
    setEditing(false);
    onClose();
  };

  return (
    <Dialog open={!!appt} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <span>Injekcija #{appt.index}</span>
          <Chip
            label={STATUS_LABELS[appt.status]}
            size="small"
            sx={{ backgroundColor: alpha(STATUS_COLOR[appt.status], 0.15), color: STATUS_COLOR[appt.status] }}
          />
        </Stack>
      </DialogTitle>
      <DialogContent>
        {!editing ? (
          <Stack spacing={1.5}>
            <InfoRow label="Planirano" value={formatDate(appt.plannedDate)} />
            {appt.actualDate && <InfoRow label="Primljeno" value={formatDate(appt.actualDate)} />}
            {deviation !== null && (
              <InfoRow
                label="Odstupanje"
                value={`${deviation > 0 ? '+' : ''}${deviation} dana`}
                valueColor={deviation === 0 ? '#66BB6A' : deviation < 0 ? '#42A5F5' : '#FFB74D'}
              />
            )}
            {appt.injectionSite && (
              <InfoRow label="Mjesto" value={INJECTION_SITE_LABELS[appt.injectionSite]} />
            )}
            {appt.medication?.lotNumber && (
              <InfoRow label="LOT broj" value={appt.medication.lotNumber} />
            )}
            {appt.notes && <InfoRow label="Bilješka" value={appt.notes} />}
            {appt.sideEffects && (
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>Nuspojave</Typography>
                <Typography variant="body2" color="text.secondary">
                  Bol: {appt.sideEffects.painLevel}/10 • Umor: {appt.sideEffects.fatigue}/10
                  {appt.sideEffects.redness && ' • Crvenilo: Da'}
                  {appt.sideEffects.swelling && ' • Oteklina: Da'}
                </Typography>
              </Box>
            )}
          </Stack>
        ) : (
          <Stack spacing={2} sx={{ mt: 1 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Status</InputLabel>
              <Select value={status} onChange={e => setStatus(e.target.value as AppointmentStatus)} label="Status">
                {Object.entries(STATUS_LABELS).map(([val, label]) => (
                  <MenuItem key={val} value={val}>{label}</MenuItem>
                ))}
              </Select>
            </FormControl>

            {status === 'completed' && (
              <TextField
                label="Stvarni datum primjene"
                type="date"
                fullWidth
                size="small"
                value={actualDate}
                onChange={e => setActualDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            )}

            <FormControl fullWidth size="small">
              <InputLabel>Mjesto primjene</InputLabel>
              <Select value={site} onChange={e => setSite(e.target.value as InjectionSite)} label="Mjesto primjene">
                <MenuItem value="">—</MenuItem>
                {Object.entries(INJECTION_SITE_LABELS).map(([val, label]) => (
                  <MenuItem key={val} value={val}>{label}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Bilješka"
              fullWidth multiline rows={2}
              size="small"
              value={notes}
              onChange={e => setNotes(e.target.value)}
            />

            {status === 'completed' && config && (
              <>
                <Typography variant="subtitle2">Prilagodi raspored?</Typography>
                <RadioGroup value={reschedule} onChange={e => setReschedule(e.target.value)}>
                  <FormControlLabel value="keep" control={<Radio size="small" />} label="Zadrži postojeći raspored" />
                  <FormControlLabel value="adjust" control={<Radio size="small" />} label="Prilagodi raspored stvarnom datumu" />
                </RadioGroup>
              </>
            )}
          </Stack>
        )}
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} color="inherit">Zatvori</Button>
        {!editing
          ? <Button variant="outlined" onClick={() => setEditing(true)}>Uredi</Button>
          : <>
              <Button onClick={() => setEditing(false)} color="inherit">Odustani</Button>
              <Button variant="contained" onClick={handleSave} disabled={saving}>
                {saving ? 'Spremam...' : 'Spremi'}
              </Button>
            </>}
      </DialogActions>
    </Dialog>
  );
}

function InfoRow({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
      <Typography variant="body2" color="text.secondary">{label}</Typography>
      <Typography variant="body2" fontWeight={600} sx={{ color: valueColor, textAlign: 'right', maxWidth: '60%' }}>
        {value}
      </Typography>
    </Stack>
  );
}

// ── Main Page ─────────────────────────────────────────────────

export default function AppointmentsPage() {
  const { appointments } = useApp();
  const [selected, setSelected] = useState<Appointment | null>(null);
  const [tab, setTab] = useState(0);

  const future = appointments.filter(a => a.status === 'planned' || a.status === 'confirmed' || a.status === 'delayed');
  const past = appointments.filter(a => a.status === 'completed' || a.status === 'skipped');

  const displayed = tab === 0 ? future : past;

  return (
    <Box sx={{ p: 2, pb: 10 }}>
      <Typography variant="h5" fontWeight={800} sx={{ mb: 2 }}>
        Termini
      </Typography>

      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        sx={{ mb: 2, '& .MuiTabs-indicator': { backgroundColor: '#00BCD4' } }}
      >
        <Tab label={`Nadolazeći (${future.length})`} />
        <Tab label={`Prošli (${past.length})`} />
      </Tabs>

      {displayed.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 6, color: 'text.secondary' }}>
          <Typography>Nema termina za prikaz</Typography>
        </Box>
      ) : (
        displayed.map(appt => (
          <ApptCard key={appt.id} appt={appt} onClick={() => setSelected(appt)} />
        ))
      )}

      <DetailDialog appt={selected} onClose={() => setSelected(null)} />
    </Box>
  );
}
