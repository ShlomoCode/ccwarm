import { spawn, spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { consola } from 'consola';
import { getNextWarmupDate, loadPlan } from '../utils.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const APP_NAME = 'ccwarm';

const pm2 = (args: string[]): Promise<{ code: number; stdout: string }> =>
  new Promise((resolve) => {
    const p = spawn('npx', ['pm2', ...args], { stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '';
    p.stdout?.on('data', (d) => {
      stdout += d;
    });
    p.stderr?.on('data', (d) => {
      stdout += d;
    });
    p.on('close', (code) => resolve({ code: code ?? 1, stdout }));
  });

export interface DaemonStatus {
  running: boolean;
  pid?: number;
}

export async function getDaemonStatus(): Promise<DaemonStatus> {
  consola.debug('Checking daemon status...');
  const { stdout } = await pm2(['jlist']);

  try {
    const list = JSON.parse(stdout);
    const app = list.find((p: { name: string }) => p.name === APP_NAME);

    if (app && app.pm2_env?.status === 'online') {
      consola.debug(`Daemon is running (PID: ${app.pid})`);
      return { running: true, pid: app.pid };
    }
  } catch (err) {
    consola.debug('Failed to parse pm2 output:', err);
  }

  consola.debug('Daemon is not running');
  return { running: false };
}

export async function startDaemon(): Promise<boolean> {
  const status = await getDaemonStatus();
  if (status.running) {
    consola.info(`Stopping existing daemon (PID: ${status.pid})...`);
    await pm2(['delete', APP_NAME]);
  }

  consola.debug('Starting daemon...');
  const runnerPath = join(__dirname, 'runner.js');
  const { code } = await pm2([
    'start',
    runnerPath,
    '--name',
    APP_NAME,
    '--interpreter',
    'node',
    '--no-autorestart',
  ]);

  if (code === 0) {
    const newStatus = await getDaemonStatus();
    consola.success(`Daemon started (PID: ${newStatus.pid})`);

    let plan = await loadPlan();
    if (!plan) {
      consola.info('No warmup plan found, running analyze...');
      const { createWarmupPlan } = await import('../analyzer.js');
      plan = await createWarmupPlan();
    }

    if (plan) {
      consola.info(
        `Next warmup: ${getNextWarmupDate(plan.targetMinute).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}`
      );
    }

    return true;
  }

  consola.error('Failed to start daemon');
  return false;
}

export async function stopDaemon(): Promise<boolean> {
  const status = await getDaemonStatus();

  if (!status.running) {
    consola.warn('Daemon is not running');
    return false;
  }

  const { code } = await pm2(['delete', APP_NAME]);

  if (code === 0) {
    consola.success(`Daemon stopped (PID: ${status.pid})`);
    return true;
  }

  consola.error('Failed to stop daemon');
  return false;
}

export async function getDaemonLogs(): Promise<void> {
  spawnSync('npx', ['pm2', 'logs', APP_NAME, '--lines', '50'], { stdio: 'inherit' });
}
