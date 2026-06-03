// ============================================================
// TREMFYA — Logika rasporeda termina
// ============================================================

import {
  addWeeks,
  differenceInDays,
  format,
  parseISO,
  isBefore,
  isToday,
  isPast,
  startOfDay,
} from 'date-fns';
import { v4 as uuidv4 } from 'uuid';
import type { Appointment, TherapyConfig, TherapyStats } from '../types';

export const DATE_FORMAT = 'dd.MM.yyyy';
export const ISO_FORMAT = "yyyy-MM-dd'T'HH:mm:ss.SSSxxx";

export function formatDate(isoString: string): string {
  return format(parseISO(isoString), DATE_FORMAT);
}

export function toISO(date: Date): string {
  return date.toISOString();
}

// ── Generiranje rasporeda ─────────────────────────────────────

/**
 * Generira sve termine na temelju konfiguracije.
 * Uvijek se drži dovoljno budućih termina (min 12 ili 2 godine unaprijed).
 */
export function generateSchedule(
  config: TherapyConfig,
  existingAppointments: Appointment[] = []
): Appointment[] {
  const { firstInjectionDate, intervalWeeks } = config;
  const firstDate = parseISO(firstInjectionDate);

  // Pronađi koliko termina treba — uvijek imaj bar 12 budućih
  const completedCount = existingAppointments.filter(
    a => a.status === 'completed' || a.status === 'skipped'
  ).length;

  const totalNeeded = Math.max(completedCount + 12, 24);

  const result: Appointment[] = [];

  for (let i = 0; i < totalNeeded; i++) {
    const plannedDate = addWeeks(firstDate, i * intervalWeeks);
    const isoDate = toISO(startOfDay(plannedDate));

    // Ako postoji u existingAppointments — zadrži podatke
    const existing = existingAppointments[i];
    if (existing) {
      result.push({ ...existing, plannedDate: isoDate, index: i + 1 });
    } else {
      result.push({
        id: uuidv4(),
        index: i + 1,
        plannedDate: isoDate,
        status: 'planned',
        notes: '',
      });
    }
  }

  return result;
}

/**
 * Regenerira buduće termine počevši od referentnog datuma i indeksa.
 */
export function recalculateFromDate(
  appointments: Appointment[],
  fromIndex: number,
  newReferenceDate: Date,
  intervalWeeks: number
): Appointment[] {
  return appointments.map(appt => {
    if (appt.index < fromIndex) return appt; // Prethodni termini ostaju
    const offset = appt.index - fromIndex;
    const newDate = addWeeks(newReferenceDate, offset * intervalWeeks);
    return {
      ...appt,
      plannedDate: toISO(startOfDay(newDate)),
    };
  });
}

// ── Status i izračun dana ─────────────────────────────────────

export function getDaysUntil(isoDate: string): number {
  return differenceInDays(parseISO(isoDate), startOfDay(new Date()));
}

export function getDaysSince(isoDate: string): number {
  return differenceInDays(startOfDay(new Date()), parseISO(isoDate));
}

export function getDeviationDays(planned: string, actual: string): number {
  return differenceInDays(parseISO(actual), parseISO(planned));
}

export function isAppointmentToday(appt: Appointment): boolean {
  return isToday(parseISO(appt.plannedDate));
}

export function isAppointmentOverdue(appt: Appointment): boolean {
  return (
    appt.status !== 'completed' &&
    appt.status !== 'skipped' &&
    isPast(parseISO(appt.plannedDate)) &&
    !isToday(parseISO(appt.plannedDate))
  );
}

export function getNextAppointment(appointments: Appointment[]): Appointment | null {
  const now = startOfDay(new Date());
  return (
    appointments
      .filter(a => a.status !== 'completed' && a.status !== 'skipped')
      .find(a => !isBefore(parseISO(a.plannedDate), now)) ?? null
  );
}

export function getLastCompletedAppointment(appointments: Appointment[]): Appointment | null {
  const completed = appointments
    .filter(a => a.status === 'completed')
    .sort((a, b) =>
      (b.actualDate ?? b.plannedDate).localeCompare(a.actualDate ?? a.plannedDate)
    );
  return completed[0] ?? null;
}

// ── Statistika ────────────────────────────────────────────────

export function calculateStats(appointments: Appointment[]): TherapyStats {
  const completed = appointments.filter(a => a.status === 'completed');
  const delayed = appointments.filter(a => a.status === 'delayed');
  const skipped = appointments.filter(a => a.status === 'skipped');

  const deviations = completed
    .filter(a => a.actualDate)
    .map(a => Math.abs(getDeviationDays(a.plannedDate, a.actualDate!)));

  const avgDev = deviations.length
    ? deviations.reduce((s, d) => s + d, 0) / deviations.length
    : 0;

  const maxDev = deviations.length ? Math.max(...deviations) : 0;

  const onTime = completed.filter(a => {
    if (!a.actualDate) return false;
    return Math.abs(getDeviationDays(a.plannedDate, a.actualDate)) <= 3;
  });

  const firstAppt = appointments[0];
  const lastCompleted = getLastCompletedAppointment(appointments);
  const durationDays =
    firstAppt && lastCompleted
      ? getDaysSince(firstAppt.plannedDate)
      : 0;

  return {
    totalReceived: completed.length,
    totalDelayed: delayed.length,
    totalSkipped: skipped.length,
    averageDeviationDays: Math.round(avgDev * 10) / 10,
    maxDeviationDays: maxDev,
    onTimePercentage: completed.length
      ? Math.round((onTime.length / completed.length) * 100)
      : 0,
    therapyDurationDays: durationDays,
    therapyDurationMonths: Math.round(durationDays / 30),
  };
}

// ── Vremenski napredak ────────────────────────────────────────

export function getProgressPercent(last: Appointment, next: Appointment): number {
  const from = parseISO(last.actualDate ?? last.plannedDate);
  const to = parseISO(next.plannedDate);
  const now = new Date();
  const total = differenceInDays(to, from);
  const elapsed = differenceInDays(now, from);
  if (total <= 0) return 100;
  return Math.min(100, Math.max(0, Math.round((elapsed / total) * 100)));
}

// ── Rotacija mjesta primjene ──────────────────────────────────

import type { InjectionSite } from '../types';

const ROTATION_ORDER: InjectionSite[] = [
  'left-thigh',
  'right-thigh',
  'left-upper-arm',
  'right-upper-arm',
  'abdomen',
];

export function suggestNextSite(lastSite?: InjectionSite): InjectionSite {
  if (!lastSite) return 'left-thigh';
  const idx = ROTATION_ORDER.indexOf(lastSite);
  return ROTATION_ORDER[(idx + 1) % ROTATION_ORDER.length];
}
