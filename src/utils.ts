import { readFile } from 'node:fs/promises';
import { paths } from './config.js';
import type { WarmupPlan } from './types.js';

export const median = (arr: number[]): number => {
  if (!arr.length) return 0;
  const sorted = arr.toSorted((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? (sorted[mid] ?? 0) : ((sorted[mid - 1] ?? 0) + (sorted[mid] ?? 0)) / 2;
};

export const daysAgo = (n: number): string => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
};

export const loadPlan = async (): Promise<WarmupPlan | null> => {
  try {
    return JSON.parse(await readFile(paths.plan, 'utf-8')) as WarmupPlan;
  } catch {
    return null;
  }
};

export const getNextWarmupDate = (targetMinute: number): Date => {
  const now = new Date();
  const date = new Date(now);
  const hours = Math.floor(targetMinute / 60);
  const minutes = targetMinute % 60;
  date.setHours(hours, minutes, 0, 0);
  if (date <= now) date.setDate(date.getDate() + 1);
  return date;
};

/** Parse time string like "11:30" or "11" to minutes from midnight */
export const parseTime = (input: string): number | null => {
  const trimmed = input.trim();

  // Format: HH:MM or H:MM
  if (trimmed.includes(':')) {
    const [hourStr, minStr] = trimmed.split(':');
    const hour = parseInt(hourStr ?? '', 10);
    const min = parseInt(minStr ?? '', 10);
    if (Number.isNaN(hour) || Number.isNaN(min) || hour < 0 || hour > 23 || min < 0 || min > 59) {
      return null;
    }
    return hour * 60 + min;
  }

  // Format: HH or H (just hours)
  const hour = parseInt(trimmed, 10);
  if (Number.isNaN(hour) || hour < 0 || hour > 23) {
    return null;
  }
  return hour * 60;
};

/** Format minutes from midnight to HH:MM string */
export const formatTime = (minutes: number): string => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
};

/** Format duration in minutes to human readable string */
export const formatDuration = (minutes: number): string => {
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
};
