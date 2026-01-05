import { consola } from 'consola';
import { createWarmupPlan } from '../analyzer.js';
import { timing } from '../config.js';
import { runWarmupWorker } from '../worker.js';

consola.info(`Daemon started (PID: ${process.pid})`);

try {
  await createWarmupPlan();
} catch (err) {
  consola.error('Initial analysis failed:', err);
}

setInterval(async () => {
  try {
    consola.info('Running daily analysis...');
    await createWarmupPlan();
  } catch (err) {
    consola.error('Daily analysis failed:', err);
  }
}, timing.day);

setInterval(async () => {
  try {
    await runWarmupWorker();
  } catch (err) {
    consola.error('Warmup check failed:', err);
  }
}, timing.minute);

consola.success('Daemon running. Analysis: every 24h, Warmup check: every 1m');
