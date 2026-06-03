// ============================================================
// TREMFYA — IndexedDB servis (idb wrapper)
// ============================================================

import { openDB, DBSchema, IDBPDatabase } from 'idb';
import type { Appointment, TherapyConfig, BackupData } from '../types';

const DB_NAME = 'tremfya-db';
const DB_VERSION = 1;

interface TremfyaDB extends DBSchema {
  appointments: {
    key: string;
    value: Appointment;
    indexes: { 'by-planned-date': string };
  };
  config: {
    key: string;
    value: { id: string; data: TherapyConfig };
  };
}

let db: IDBPDatabase<TremfyaDB> | null = null;

async function getDB(): Promise<IDBPDatabase<TremfyaDB>> {
  if (db) return db;
  db = await openDB<TremfyaDB>(DB_NAME, DB_VERSION, {
    upgrade(database) {
      if (!database.objectStoreNames.contains('appointments')) {
        const store = database.createObjectStore('appointments', { keyPath: 'id' });
        store.createIndex('by-planned-date', 'plannedDate');
      }
      if (!database.objectStoreNames.contains('config')) {
        database.createObjectStore('config', { keyPath: 'id' });
      }
    },
  });
  return db;
}

// ── Config ──────────────────────────────────────────────────

export async function getConfig(): Promise<TherapyConfig | null> {
  const database = await getDB();
  const row = await database.get('config', 'main');
  return row?.data ?? null;
}

export async function saveConfig(config: TherapyConfig): Promise<void> {
  const database = await getDB();
  await database.put('config', { id: 'main', data: config });
}

// ── Appointments ─────────────────────────────────────────────

export async function getAllAppointments(): Promise<Appointment[]> {
  const database = await getDB();
  const all = await database.getAll('appointments');
  return all.sort((a, b) => a.plannedDate.localeCompare(b.plannedDate));
}

export async function getAppointment(id: string): Promise<Appointment | undefined> {
  const database = await getDB();
  return database.get('appointments', id);
}

export async function saveAppointment(appt: Appointment): Promise<void> {
  const database = await getDB();
  await database.put('appointments', appt);
}

export async function saveAllAppointments(appts: Appointment[]): Promise<void> {
  const database = await getDB();
  const tx = database.transaction('appointments', 'readwrite');
  await Promise.all(appts.map(a => tx.store.put(a)));
  await tx.done;
}

export async function deleteAppointment(id: string): Promise<void> {
  const database = await getDB();
  await database.delete('appointments', id);
}

export async function clearAllAppointments(): Promise<void> {
  const database = await getDB();
  await database.clear('appointments');
}

// ── Backup / Restore ─────────────────────────────────────────

export async function exportBackup(): Promise<BackupData> {
  const config = await getConfig();
  if (!config) throw new Error('Nema konfiguracije za izvoz');
  const appointments = await getAllAppointments();
  return {
    version: '1.0',
    exportDate: new Date().toISOString(),
    config,
    appointments,
  };
}

export async function importBackup(data: BackupData): Promise<void> {
  await saveConfig(data.config);
  await clearAllAppointments();
  await saveAllAppointments(data.appointments);
  // Reset in-memory db ref to force reload
  db = null;
}
