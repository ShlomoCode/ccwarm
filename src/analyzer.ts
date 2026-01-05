import { writeFile } from 'node:fs/promises';
import { loadSessionBlockData } from 'ccusage/data-loader';
import { consola } from 'consola';
import { ensureConfigDir, paths } from './config.js';
import type { WarmupPlan } from './types.js';
import { daysAgo, formatTime, median } from './utils.js';

export async function createWarmupPlan(days = 30): Promise<WarmupPlan | null> {
  consola.info(`Analyzing Claude usage patterns (last ${days} days)...`);

  try {
    await ensureConfigDir();

    const blocks = await loadSessionBlockData({ since: daysAgo(days), offline: true });
    consola.info(`Found ${blocks?.length ?? 0} usage blocks`);

    if (!blocks?.length) {
      consola.warn('No usage blocks found');
      return null;
    }

    // Filter out very short sessions (e.g., warmup pings) to avoid skewing analysis
    const MIN_SESSION_MINUTES = 1;

    const sessions = blocks
      .filter(
        (b): b is typeof b & { actualEndTime: NonNullable<typeof b.actualEndTime> } =>
          !b.isGap && !!b.actualEndTime
      )
      .map((b) => {
        const start = new Date(b.startTime);
        return {
          startMinute: start.getHours() * 60 + start.getMinutes(),
          durationMs: new Date(b.actualEndTime).getTime() - start.getTime(),
        };
      })
      .filter((s) => s.durationMs >= MIN_SESSION_MINUTES * 60_000)
      .map((s) => ({
        startMinute: s.startMinute,
        durationMinutes: s.durationMs / 60_000,
      }));

    consola.debug(`Found ${sessions.length} sessions`);

    const MIN_SESSIONS = 3;
    if (sessions.length < MIN_SESSIONS) {
      consola.warn(`Not enough data (need at least ${MIN_SESSIONS} sessions)`);
      return null;
    }

    const medianStartMinute = median(sessions.map((s) => s.startMinute));
    const medianDurationMinutes = median(sessions.map((s) => s.durationMinutes));
    consola.debug(
      `Median start: ${formatTime(medianStartMinute)}, Median duration: ${Math.round(medianDurationMinutes)}min`
    );

    let targetMinute = Math.round(medianStartMinute - medianDurationMinutes / 2);
    // Normalize to valid range (0-1439)
    const MINUTES_PER_DAY = 24 * 60;
    targetMinute = ((targetMinute % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY;

    const plan: WarmupPlan = {
      targetMinute,
      medianStartMinute,
      medianDurationMinutes,
      calculatedAt: new Date().toISOString(),
    };

    await writeFile(paths.plan, JSON.stringify(plan, null, 2));
    consola.success(`Plan updated: Target Warmup at ${formatTime(targetMinute)}`);

    return plan;
  } catch (error) {
    consola.error('Analysis failed:', error);
    return null;
  }
}
