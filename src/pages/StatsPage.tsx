// ============================================================
// TREMFYA — Statistika
// ============================================================

import React from 'react';
import {
  Box, Card, CardContent, Typography, Stack, Grid,
  Divider,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, Title, Tooltip, Legend, Filler,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import { format, parseISO } from 'date-fns';
import { useApp } from '../hooks/useApp';
import { calculateStats, getDeviationDays } from '../utils/scheduling';

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, Title, Tooltip, Legend, Filler
);

const CHART_OPTIONS = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    x: {
      grid: { color: 'rgba(255,255,255,0.05)' },
      ticks: { color: '#90A4AE', font: { size: 10 } },
    },
    y: {
      grid: { color: 'rgba(255,255,255,0.05)' },
      ticks: { color: '#90A4AE', font: { size: 10 } },
    },
  },
};

interface StatBlockProps {
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
}

function StatBlock({ label, value, sub, color = '#00BCD4' }: StatBlockProps) {
  return (
    <Box
      sx={{
        p: 2, borderRadius: 3,
        background: alpha(color, 0.07),
        border: `1px solid ${alpha(color, 0.2)}`,
        textAlign: 'center',
      }}
    >
      <Typography variant="h4" fontWeight={800} sx={{ color }}>
        {value}
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
        {label}
      </Typography>
      {sub && (
        <Typography variant="caption" sx={{ color: alpha(color, 0.7) }}>
          {sub}
        </Typography>
      )}
    </Box>
  );
}

export default function StatsPage() {
  const { appointments } = useApp();
  const stats = calculateStats(appointments);

  const completed = appointments.filter(a => a.status === 'completed' && a.actualDate);

  // ── Deviation over time ──────────────────────────────────────
  const deviationLabels = completed.map(a => `#${a.index}`);
  const deviationData = completed.map(a =>
    getDeviationDays(a.plannedDate, a.actualDate!)
  );

  const deviationChart = {
    labels: deviationLabels,
    datasets: [{
      label: 'Odstupanje (dani)',
      data: deviationData,
      borderColor: '#00BCD4',
      backgroundColor: alpha('#00BCD4', 0.15),
      fill: true,
      tension: 0.3,
      pointRadius: 4,
      pointBackgroundColor: '#00BCD4',
    }],
  };

  // ── Side effects trends ──────────────────────────────────────
  const withSe = completed.filter(a => a.sideEffects);
  const seLabels = withSe.map(a => `#${a.index}`);
  const painData = withSe.map(a => a.sideEffects!.painLevel);
  const fatigueData = withSe.map(a => a.sideEffects!.fatigue);
  const headacheData = withSe.map(a => a.sideEffects!.headache);

  const seChart = {
    labels: seLabels,
    datasets: [
      {
        label: 'Bol',
        data: painData,
        borderColor: '#EF5350',
        backgroundColor: alpha('#EF5350', 0.1),
        fill: false,
        tension: 0.3,
        pointRadius: 3,
      },
      {
        label: 'Umor',
        data: fatigueData,
        borderColor: '#FFB74D',
        backgroundColor: alpha('#FFB74D', 0.1),
        fill: false,
        tension: 0.3,
        pointRadius: 3,
      },
      {
        label: 'Glavobolja',
        data: headacheData,
        borderColor: '#CE93D8',
        backgroundColor: alpha('#CE93D8', 0.1),
        fill: false,
        tension: 0.3,
        pointRadius: 3,
      },
    ],
  };

  const seChartOptions = {
    ...CHART_OPTIONS,
    plugins: {
      ...CHART_OPTIONS.plugins,
      legend: {
        display: true,
        labels: { color: '#90A4AE', font: { size: 11 } },
      },
    },
    scales: {
      ...CHART_OPTIONS.scales,
      y: { ...CHART_OPTIONS.scales.y, min: 0, max: 10 },
    },
  };

  // ── Status distribution bar ──────────────────────────────────
  const statusChart = {
    labels: ['Primljeno', 'Odgođeno', 'Preskočeno'],
    datasets: [{
      data: [stats.totalReceived, stats.totalDelayed, stats.totalSkipped],
      backgroundColor: [
        alpha('#66BB6A', 0.7),
        alpha('#FFB74D', 0.7),
        alpha('#EF5350', 0.7),
      ],
      borderRadius: 6,
    }],
  };

  return (
    <Box sx={{ p: 2, pb: 10 }}>
      <Typography variant="h5" fontWeight={800} sx={{ mb: 2 }}>
        Statistika
      </Typography>

      {/* Summary grid */}
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5, mb: 2 }}>
        <StatBlock label="Primljeno" value={stats.totalReceived} color="#00BCD4" />
        <StatBlock label="Na vrijeme" value={`${stats.onTimePercentage}%`} color="#66BB6A" />
        <StatBlock label="Prosj. odstupanje" value={`${stats.averageDeviationDays}d`} color="#FFB74D" />
        <StatBlock label="Max odstupanje" value={`${stats.maxDeviationDays}d`} color="#EF5350" />
      </Box>

      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 0.5 }}>
            Trajanje terapije
          </Typography>
          <Typography variant="h5" sx={{ color: '#80CBC4', fontWeight: 700 }}>
            {stats.therapyDurationMonths} mj. ({stats.therapyDurationDays} dana)
          </Typography>
        </CardContent>
      </Card>

      {/* Deviation chart */}
      {completed.length >= 2 && (
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
              Odstupanje po injekciji (dani)
            </Typography>
            <Box sx={{ height: 160 }}>
              <Line data={deviationChart} options={CHART_OPTIONS as any} />
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Status bar chart */}
      {stats.totalReceived > 0 && (
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
              Pregled statusa
            </Typography>
            <Box sx={{ height: 140 }}>
              <Bar data={statusChart} options={CHART_OPTIONS as any} />
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Side effects trends */}
      {withSe.length >= 2 && (
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
              Trend nuspojava (0-10)
            </Typography>
            <Box sx={{ height: 180 }}>
              <Line data={seChart} options={seChartOptions as any} />
            </Box>
          </CardContent>
        </Card>
      )}

      {stats.totalReceived === 0 && (
        <Box sx={{ textAlign: 'center', py: 6, color: 'text.secondary' }}>
          <Typography>Statistika će biti dostupna nakon prve primljene injekcije.</Typography>
        </Box>
      )}
    </Box>
  );
}
