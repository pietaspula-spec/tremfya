// ============================================================
// TREMFYA — Globalni app state (React Context + hooks)
// ============================================================

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import type { Appointment, TherapyConfig } from '../types';
import * as db from '../services/db';
import {
  generateSchedule,
  recalculateFromDate,
  getNextAppointment,
  getLastCompletedAppointment,
} from '../utils/scheduling';
import { parseISO } from 'date-fns';

interface AppContextType {
  config: TherapyConfig | null;
  appointments: Appointment[];
  loading: boolean;
  initialized: boolean;
  saveConfig: (cfg: TherapyConfig) => Promise<void>;
  updateAppointment: (appt: Appointment, rescheduleAll?: boolean, newRefDate?: Date) => Promise<void>;
  markCompleted: (id: string, actualDate: Date, rescheduleAll?: boolean) => Promise<void>;
  refreshAppointments: () => Promise<void>;
  nextAppointment: Appointment | null;
  lastCompleted: Appointment | null;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<TherapyConfig | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const cfg = await db.getConfig();
      const appts = await db.getAllAppointments();
      setConfig(cfg);
      setAppointments(appts);
      setInitialized(!!cfg);
    } catch (e) {
      console.error('Greška pri učitavanju podataka:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Osiguraj da uvijek postoji dovoljno budućih termina
  useEffect(() => {
    if (!config || appointments.length === 0) return;
    const future = appointments.filter(a => a.status === 'planned' || a.status === 'confirmed');
    if (future.length < 6) {
      // Regeneriraj raspored
      const newAppts = generateSchedule(config, appointments);
      db.saveAllAppointments(newAppts).then(() => setAppointments(newAppts));
    }
  }, [config, appointments]);

  const saveConfigFn = useCallback(async (cfg: TherapyConfig) => {
    await db.saveConfig(cfg);
    setConfig(cfg);
    // Generiraj početni raspored
    const existing = await db.getAllAppointments();
    const schedule = generateSchedule(cfg, existing);
    await db.clearAllAppointments();
    await db.saveAllAppointments(schedule);
    setAppointments(schedule);
    setInitialized(true);
  }, []);

  const updateAppointment = useCallback(
    async (appt: Appointment, rescheduleAll = false, newRefDate?: Date) => {
      if (rescheduleAll && newRefDate && config) {
        const updated = recalculateFromDate(
          appointments,
          appt.index,
          newRefDate,
          config.intervalWeeks
        );
        // Zamijeni podatke odabranog termina
        const final = updated.map(a => (a.id === appt.id ? appt : a));
        await db.saveAllAppointments(final);
        setAppointments(final);
      } else {
        await db.saveAppointment(appt);
        setAppointments(prev => prev.map(a => (a.id === appt.id ? appt : a)));
      }
    },
    [appointments, config]
  );

  const markCompleted = useCallback(
    async (id: string, actualDate: Date, rescheduleAll = false) => {
      const appt = appointments.find(a => a.id === id);
      if (!appt || !config) return;
      const updated: Appointment = {
        ...appt,
        status: 'completed',
        actualDate: actualDate.toISOString(),
      };
      await updateAppointment(updated, rescheduleAll, rescheduleAll ? actualDate : undefined);
    },
    [appointments, config, updateAppointment]
  );

  const refreshAppointments = useCallback(async () => {
    const appts = await db.getAllAppointments();
    setAppointments(appts);
  }, []);

  const nextAppointment = getNextAppointment(appointments);
  const lastCompleted = getLastCompletedAppointment(appointments);

  return (
    <AppContext.Provider
      value={{
        config,
        appointments,
        loading,
        initialized,
        saveConfig: saveConfigFn,
        updateAppointment,
        markCompleted,
        refreshAppointments,
        nextAppointment,
        lastCompleted,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppContextType {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
