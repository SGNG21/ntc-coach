// lib/engagement.ts

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

// Fix 1 — Explicit SSR guard
function hasLS(): boolean {
  return typeof window !== 'undefined';
}

// Fix 2 — Local timezone date string (replaces UTC-based toISOString)
function toDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function todayStr(): string {
  return toDateStr(new Date());
}

function yesterdayStr(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return toDateStr(d);
}

// Fix 2 — Parse dateStr as local midnight to avoid UTC-offset shift
function addDays(dateStr: string, n: number): string {
  const d = new Date(`${dateStr}T00:00:00`);
  d.setDate(d.getDate() + n);
  return toDateStr(d);
}

function dispatchStorage() {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event('storage'));
}

// ── Streak ──────────────────────────────────────────────────────────────────

export function loadStreak(): StreakData {
  // Fix 1 — explicit SSR guard
  if (!hasLS()) return { count: 0, lastDate: '', longest: 0 };
  try {
    // Fix 4 — merge with defaults to handle partial stored objects
    const defaults: StreakData = { count: 0, lastDate: '', longest: 0 };
    const parsed = JSON.parse(localStorage.getItem(LS_STREAK) || 'null');
    return parsed ? { ...defaults, ...parsed } : defaults;
  } catch {
    return { count: 0, lastDate: '', longest: 0 };
  }
}

function saveStreak(s: StreakData): void {
  // Fix 1 — explicit SSR guard
  if (!hasLS()) return;
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
  // Fix 1 — explicit SSR guard
  if (!hasLS()) return {};
  try {
    // Fix 4 — ensure parsed value is a non-null object
    const parsed = JSON.parse(localStorage.getItem(LS_SRS) || 'null');
    return parsed !== null && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function saveSRS(data: SrsData): void {
  // Fix 1 — explicit SSR guard
  if (!hasLS()) return;
  try { localStorage.setItem(LS_SRS, JSON.stringify(data)); } catch { /* ignore */ }
}

function scoreToInterval(pct: number): number {
  if (pct < 50) return 1;
  if (pct < 75) return 3;
  if (pct < 90) return 7;
  return 14;
}

// Fix 6 — moduleId: string (ModuleId | string collapses to string)
export function updateSRS(moduleId: string, scorePercent: number): void {
  // Fix 5 — clamp scorePercent to [0, 100]
  const clamped = Math.max(0, Math.min(100, scorePercent));
  const data = loadSRS();
  const prev = data[moduleId];
  const interval = scoreToInterval(clamped);
  data[moduleId] = {
    interval,
    dueDate: addDays(todayStr(), interval),
    lastScore: Math.round(clamped),
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
  // Fix 3 — parse as local midnight to avoid UTC-offset shift
  const delays = Object.values(loadSRS())
    .filter(e => e.dueDate > t)
    .map(e => Math.ceil(
      (new Date(`${e.dueDate}T00:00:00`).getTime() - new Date(`${t}T00:00:00`).getTime()) / 86400000
    ));
  return delays.length === 0 ? null : Math.min(...delays);
}
