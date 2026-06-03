// ============================================================
// TREMFYA — Postavke (Settings + Backup + PDF)
// ============================================================

import React, { useState, useRef } from 'react';
import {
  Box, Card, CardContent, Typography, Stack, Switch,
  FormControlLabel, Button, Divider, Alert, Slider,
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, FormGroup, Checkbox, CircularProgress,
  List, ListItem, ListItemIcon, ListItemText,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import DownloadIcon from '@mui/icons-material/Download';
import UploadIcon from '@mui/icons-material/Upload';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import NotificationsIcon from '@mui/icons-material/Notifications';
import SettingsIcon from '@mui/icons-material/Settings';
import InfoIcon from '@mui/icons-material/Info';
import WarningIcon from '@mui/icons-material/Warning';
import { format, parseISO } from 'date-fns';
import { hr } from 'date-fns/locale';
import jsPDF from 'jspdf';
import QRCode from 'qrcode';
import { useApp } from '../hooks/useApp';
import { exportBackup, importBackup } from '../services/db';
import type { BackupData, TherapyConfig } from '../types';
import { calculateStats, formatDate, getDeviationDays } from '../utils/scheduling';
import { STATUS_LABELS, INJECTION_SITE_LABELS } from '../types';

// ── PDF Generator ─────────────────────────────────────────────

async function generatePDF(
  config: TherapyConfig,
  appointments: ReturnType<typeof useApp>['appointments']
): Promise<void> {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const stats = calculateStats(appointments);
  const completed = appointments.filter(a => a.status === 'completed');

  const W = 210; const M = 15; const CW = W - 2 * M;
  let y = 15;

  const addLine = (text: string, size = 10, bold = false, color = [0, 0, 0]) => {
    doc.setFontSize(size);
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.setTextColor(color[0], color[1], color[2]);
    doc.text(text, M, y);
    y += size * 0.5;
  };

  const newPage = () => { doc.addPage(); y = 15; };
  const checkPage = (needed = 20) => { if (y + needed > 280) newPage(); };

  // Header
  doc.setFillColor(21, 101, 192);
  doc.rect(0, 0, W, 28, 'F');
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('Tremfya - Izvješće o terapiji', M, 12);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generirano: ${format(new Date(), 'dd.MM.yyyy. HH:mm')}`, M, 20);
  y = 35;

  // Therapy info
  addLine('PODACI O TERAPIJI', 12, true, [21, 101, 192]);
  y += 2;
  addLine(`Datum pocetka: ${formatDate(config.firstInjectionDate)}`);
  addLine(`Interval: svakih ${config.intervalWeeks} tjedana`);
  addLine(`Ukupno primljeno: ${stats.totalReceived} injekcija`);
  addLine(`Trajanje terapije: ${stats.therapyDurationMonths} mjeseci (${stats.therapyDurationDays} dana)`);
  y += 4;

  // Stats
  addLine('STATISTIKA', 12, true, [21, 101, 192]);
  y += 2;
  addLine(`Primljeno na vrijeme (<= 3 dana): ${stats.onTimePercentage}%`);
  addLine(`Prosjecno odstupanje: ${stats.averageDeviationDays} dana`);
  addLine(`Maksimalno odstupanje: ${stats.maxDeviationDays} dana`);
  addLine(`Odgodeno: ${stats.totalDelayed} | Preskoceno: ${stats.totalSkipped}`);
  y += 6;

  // Injections table header
  checkPage(15);
  addLine('POVIJEST INJEKCIJA', 12, true, [21, 101, 192]);
  y += 2;

  // Table header row
  doc.setFillColor(240, 244, 248);
  doc.rect(M, y - 4, CW, 7, 'F');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  const cols = [M, M + 10, M + 35, M + 60, M + 85, M + 110, M + 140];
  const headers = ['#', 'Planirano', 'Primljeno', 'Odst.', 'Status', 'Mjesto', 'LOT'];
  headers.forEach((h, i) => doc.text(h, cols[i], y));
  y += 6;

  // Rows
  completed.forEach((appt, idx) => {
    checkPage(8);
    if (idx % 2 === 0) {
      doc.setFillColor(248, 250, 252);
      doc.rect(M, y - 4, CW, 6, 'F');
    }
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    const dev = appt.actualDate ? getDeviationDays(appt.plannedDate, appt.actualDate) : 0;
    const row = [
      `${appt.index}`,
      formatDate(appt.plannedDate),
      appt.actualDate ? formatDate(appt.actualDate) : '-',
      appt.actualDate ? `${dev > 0 ? '+' : ''}${dev}d` : '-',
      STATUS_LABELS[appt.status],
      appt.injectionSite ? INJECTION_SITE_LABELS[appt.injectionSite].substring(0, 12) : '-',
      appt.medication?.lotNumber ?? '-',
    ];
    row.forEach((cell, i) => doc.text(cell, cols[i], y));
    y += 6;
  });

  // QR Code
  y += 8;
  checkPage(50);
  addLine('QR KOD — SAZETAK TERAPIJE', 12, true, [21, 101, 192]);
  y += 2;

  const qrData = JSON.stringify({
    app: 'Tremfya',
    start: formatDate(config.firstInjectionDate),
    interval: `${config.intervalWeeks}w`,
    received: stats.totalReceived,
    onTime: `${stats.onTimePercentage}%`,
    generated: format(new Date(), 'dd.MM.yyyy'),
  });

  try {
    const qrDataUrl = await QRCode.toDataURL(qrData, { width: 150, margin: 1 });
    doc.addImage(qrDataUrl, 'PNG', M, y, 40, 40);
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text('Skenirajte za brzi pregled podataka o terapiji', M + 45, y + 20);
    y += 45;
  } catch (e) { /* QR fallback */ }

  // Footer on all pages
  const totalPages = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`Tremfya Pracenje Terapije | Stranica ${i} od ${totalPages}`, M, 290);
  }

  doc.save(`Tremfya_Izvjestaj_${format(new Date(), 'yyyyMMdd')}.pdf`);
}

// ── Notification helper ───────────────────────────────────────

async function requestNotifications(): Promise<boolean> {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  const result = await Notification.requestPermission();
  return result === 'granted';
}

// ── Main Settings ─────────────────────────────────────────────

export default function SettingsPage() {
  const { config, appointments, saveConfig } = useApp();
  const [msg, setMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [resetConfirm, setResetConfirm] = useState(false);
  const [intervalWeeks, setIntervalWeeks] = useState(config?.intervalWeeks ?? 8);
  const fileRef = useRef<HTMLInputElement>(null);

  const showMsg = (text: string, type: 'success' | 'error') => {
    setMsg({ text, type });
    setTimeout(() => setMsg(null), 4000);
  };

  const handleExport = async () => {
    try {
      const data = await exportBackup();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Tremfya_Backup_${format(new Date(), 'yyyyMMdd_HHmm')}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showMsg('Sigurnosna kopija uspješno izvezena.', 'success');
    } catch (e) {
      showMsg('Greška pri izvozu.', 'error');
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const data: BackupData = JSON.parse(text);
      if (!data.config || !data.appointments) throw new Error('Nevažeći format');
      await importBackup(data);
      showMsg('Podaci uspješno uvezeni. Osvježite stranicu.', 'success');
      setTimeout(() => window.location.reload(), 1500);
    } catch (e) {
      showMsg('Greška pri uvozu — provjerite datoteku.', 'error');
    }
    e.target.value = '';
  };

  const handlePDF = async () => {
    if (!config) return;
    setPdfLoading(true);
    try {
      await generatePDF(config, appointments);
      showMsg('PDF izvještaj generiran.', 'success');
    } catch (e) {
      showMsg('Greška pri generiranju PDF-a.', 'error');
    }
    setPdfLoading(false);
  };

  const handleNotifications = async () => {
    const granted = await requestNotifications();
    if (granted && config) {
      await saveConfig({ ...config, notificationsEnabled: true });
      showMsg('Podsjetnici aktivirani.', 'success');
    } else {
      showMsg('Podsjetnici nisu odobreni.', 'error');
    }
  };

  const handleIntervalSave = async () => {
    if (!config) return;
    await saveConfig({ ...config, intervalWeeks });
    showMsg('Interval terapije ažuriran.', 'success');
  };

  return (
    <Box sx={{ p: 2, pb: 10 }}>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
        <SettingsIcon />
        <Typography variant="h5" fontWeight={800}>Postavke</Typography>
      </Stack>

      {msg && <Alert severity={msg.type} sx={{ mb: 2 }}>{msg.text}</Alert>}

      {/* Therapy interval */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1 }}>
            Interval terapije
          </Typography>
          <Typography variant="h5" align="center" sx={{ color: '#00BCD4', mb: 1 }}>
            {intervalWeeks} tjedana
          </Typography>
          <Slider
            value={intervalWeeks}
            onChange={(_, v) => setIntervalWeeks(v as number)}
            min={2} max={12} step={1}
            marks={[{ value: 4, label: '4t' }, { value: 8, label: '8t' }, { value: 12, label: '12t' }]}
            sx={{ color: '#00BCD4', mb: 1 }}
          />
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
            ⚠️ Promjena intervala će preračunati sve buduće termine.
          </Typography>
          <Button variant="outlined" size="small" onClick={handleIntervalSave}>
            Spremi interval
          </Button>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
            <NotificationsIcon sx={{ color: '#00BCD4' }} />
            <Typography variant="subtitle1" fontWeight={700}>Podsjetnici</Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
            Podsjetnici: 14, 7, 3, 1 dan prije i na dan injekcije.
          </Typography>
          <Button
            variant="contained"
            onClick={handleNotifications}
            disabled={config?.notificationsEnabled}
            startIcon={<NotificationsIcon />}
          >
            {config?.notificationsEnabled ? 'Podsjetnici aktivni ✓' : 'Aktiviraj podsjetnike'}
          </Button>
        </CardContent>
      </Card>

      {/* Backup */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5 }}>
            Sigurnosna kopija
          </Typography>
          <Stack spacing={1.5}>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={handleExport}
              fullWidth
            >
              Izradi sigurnosnu kopiju (JSON)
            </Button>
            <Button
              variant="outlined"
              startIcon={<UploadIcon />}
              onClick={() => fileRef.current?.click()}
              fullWidth
            >
              Vrati iz sigurnosne kopije
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept=".json"
              hidden
              onChange={handleImport}
            />
          </Stack>
        </CardContent>
      </Card>

      {/* PDF */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 0.5 }}>
            PDF izvještaj za liječnika
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
            Profesionalni izvještaj s kompletnom poviješću terapije, statistikama i QR kodom.
          </Typography>
          <Button
            variant="contained"
            startIcon={pdfLoading ? <CircularProgress size={18} color="inherit" /> : <PictureAsPdfIcon />}
            onClick={handlePDF}
            disabled={pdfLoading || appointments.filter(a => a.status === 'completed').length === 0}
            fullWidth
            sx={{ background: 'linear-gradient(135deg, #1565C0 0%, #00BCD4 100%)' }}
          >
            {pdfLoading ? 'Generiranje...' : 'Generiraj PDF izvještaj'}
          </Button>
        </CardContent>
      </Card>

      {/* App info */}
      <Card>
        <CardContent>
          <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
            <InfoIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
            <Typography variant="subtitle1" fontWeight={700}>O aplikaciji</Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary">
            Tremfya Praćenje Terapije v1.0
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Svi podaci se čuvaju lokalno na vašem uređaju.
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            ⚕️ Aplikacija ne zamjenjuje medicinski savjet. Uvijek konzultirajte svog liječnika.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}
