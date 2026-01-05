import { mkdir } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';

const home = homedir();

export const paths = {
  config: join(home, '.ccwarm'),
  plan: join(home, '.ccwarm', 'warmup_plan.json'),
  pid: join(home, '.ccwarm', 'daemon.pid'),
  log: join(home, '.ccwarm', 'daemon.log'),
} as const;

export const timing = {
  minute: 60 * 1000,
  hour: 60 * 60 * 1000,
  day: 24 * 60 * 60 * 1000,
} as const;

export const ensureConfigDir = () => mkdir(paths.config, { recursive: true });
