import { loadSessionBlockData } from 'ccusage/data-loader';
import { consola } from 'consola';
import { execa } from 'execa';
import { formatTime, loadPlan } from './utils.js';

export async function runWarmupWorker(): Promise<boolean> {
  consola.info('Running warmup check...');
  try {
    const plan = await loadPlan();
    if (!plan) {
      consola.warn("No warmup plan found. Run 'ccwarm analyze' first.");
      return false;
    }
    const now = new Date();
    const currentMinute = now.getHours() * 60 + now.getMinutes();
    const effectiveMinute = plan.targetMinute;

    if (currentMinute !== effectiveMinute) {
      consola.debug(
        `Not warmup time yet. Current: ${formatTime(currentMinute)}, Target: ${formatTime(effectiveMinute)}`
      );
      return false;
    }

    consola.info('Target time matched. Checking for active sessions...');

    const blocks = await loadSessionBlockData();
    if (blocks?.some((b) => b.isActive)) {
      consola.info('Session already active. Skipping warmup.');
      return false;
    }

    consola.start('Warming up Claude...');
    await execa('claude', ['-c', 'say hi'], { stdio: 'inherit', timeout: 40_000 });
    consola.success('Warmup complete!');

    return true;
  } catch (err) {
    consola.error('Warmup failed:', err);
    return false;
  }
}
