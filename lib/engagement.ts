// lib/engagement.ts
import type { ModuleId } from '@/types';

const LS_STREAK = 'ntc_streak';
const LS_SRS    = 'ntc_srs';

export interface StreakData {
  count: number;
  lastDate: string; // 'YYYY-MM-DD'
  longest: number;
}

export interface SrsEntry {
  interval: number;    // jours
  dueDate: string;     // 'YYYY-MM-DD'
  lastScore: number;   // 0–100
  reviewCount: number;
}

export type SrsData = Record<string, SrsEntry>;

function toDateStr(d: Date): string {
  return d.toISOString().split('T')[0];
}

function todayStr(): string {
  return toDateStr(new Date());
}

function yesterdayStr(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return toDateStr(d);
}

function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + n);
  return toDateStr(d);
}

function dispatchStorage() {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event('storage'));
}

// ── Streak ──────────────────────────────────────────────────────────────────

export function loadStreak(): StreakData {
  try {
    return JSON.parse(localStorage.getItem(LS_STREAK) || 'null') ?? { count: 0, lastDate: '', longest: 0 };
  } catch {
    return { count: 0, lastDate: '', longest: 0 };
  }
}

function saveStreak(s: StreakData): void {
  try { localStorage.setItem(LS_STREAK, JSON.stringify(s)); } catch { /* ignore */ }
}

export function updateStreak(): StreakData {
  const s = loadStreak();
  const t = todayStr();
  if (s.lastDate === t) return s; // déjà comptabilisé aujourd'hui
  const newCount = s.lastDate === yesterdayStr() ? s.count + 1 : 1;
  const updated: StreakData = {
    count: newCount,
    lastDate: t,
    longest: Math.max(s.longest, newCount),
  };
  saveStreak(updated);
  dispatchStorage();
  return updated;
}

// ── SRS ─────────────────────────────────────────────────────────────────────

export function loadSRS(): SrsData {
  try {
    return JSON.parse(localStorage.getItem(LS_SRS) || 'null') ?? {};
  } catch {
    return {};
  }
}

function saveSRS(data: SrsData): void {
  try { localStorage.setItem(LS_SRS, JSON.stringify(data)); } catch { /* ignore */ }
}

function scoreToInterval(pct: number): number {
  if (pct < 50) return 1;
  if (pct < 75) return 3;
  if (pct < 90) return 7;
  return 14;
}

export function updateSRS(moduleId: ModuleId | string, scorePercent: number): void {
  const data = loadSRS();
  const prev = data[moduleId];
  const interval = scoreToInterval(scorePercent);
  data[moduleId] = {
    interval,
    dueDate: addDays(todayStr(), interval),
    lastScore: Math.round(scorePercent),
    reviewCount: (prev?.reviewCount ?? 0) + 1,
  };
  saveSRS(data);
  dispatchStorage();
}

export function getDueModules(): string[] {
  const t = todayStr();
  return Object.entries(loadSRS())
    .filter(([, e]) => e.dueDate <= t)
    .map(([id]) => id);
}

export function getDaysUntilNextDue(): number | null {
  const t = todayStr();
  const delays = Object.values(loadSRS())
    .filter(e => e.dueDate > t)
    .map(e => Math.ceil((new Date(e.dueDate).getTime() - new Date(t).getTime()) / 86400000));
  return delays.length === 0 ? null : Math.min(...delays);
}
