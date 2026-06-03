// ============================================================
// TREMFYA PRAĆENJE TERAPIJE — TypeScript tipovi
// ============================================================

export type AppointmentStatus =
  | 'planned'
  | 'confirmed'
  | 'completed'
  | 'delayed'
  | 'skipped';

export type InjectionSite =
  | 'left-thigh'
  | 'right-thigh'
  | 'left-upper-arm'
  | 'right-upper-arm'
  | 'abdomen';

export const INJECTION_SITE_LABELS: Record<InjectionSite, string> = {
  'left-thigh': 'Lijevo bedro',
  'right-thigh': 'Desno bedro',
  'left-upper-arm': 'Lijeva nadlaktica',
  'right-upper-arm': 'Desna nadlaktica',
  abdomen: 'Trbuh',
};

export const STATUS_LABELS: Record<AppointmentStatus, string> = {
  planned: 'Planirano',
  confirmed: 'Potvrđeno',
  completed: 'Obavljeno',
  delayed: 'Odgođeno',
  skipped: 'Preskočeno',
};

export interface SideEffect {
  painLevel: number;       // 0-10
  redness: boolean;
  swelling: boolean;
  fatigue: number;         // 0-10
  headache: number;        // 0-10
  other: string;
}

export interface MedicationInfo {
  lotNumber: string;
  serialNumber: string;
  expiryDate: string;      // ISO date string
  photoBase64?: string;
}

export interface Appointment {
  id: string;
  index: number;           // Redni broj injekcije (1, 2, 3...)
  plannedDate: string;     // ISO date string
  actualDate?: string;     // ISO date string — stvarni datum primjene
  status: AppointmentStatus;
  notes: string;
  sideEffects?: SideEffect;
  medication?: MedicationInfo;
  injectionSite?: InjectionSite;
}

export interface TherapyConfig {
  firstInjectionDate: string;   // ISO date string
  intervalWeeks: number;        // Default: 8
  showFutureCount: number;      // Broj budućih termina za prikaz
  reminderDays: number[];       // [1, 3, 7, 14]
  notificationsEnabled: boolean;
  darkMode: boolean;
}

export interface AppState {
  config: TherapyConfig | null;
  appointments: Appointment[];
}

export interface BackupData {
  version: string;
  exportDate: string;
  config: TherapyConfig;
  appointments: Appointment[];
}

// Stats
export interface TherapyStats {
  totalReceived: number;
  totalDelayed: number;
  totalSkipped: number;
  averageDeviationDays: number;
  maxDeviationDays: number;
  onTimePercentage: number;
  therapyDurationDays: number;
  therapyDurationMonths: number;
}
