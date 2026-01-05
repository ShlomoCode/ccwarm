#!/usr/bin/env node

import { readFile } from 'node:fs/promises';
import { consola } from 'consola';
import { createWarmupPlan } from './src/analyzer.js';
import { paths } from './src/config.js';
import { getDaemonLogs, getDaemonStatus, startDaemon, stopDaemon } from './src/daemon/manager.js';
import type { WarmupPlan } from './src/types.js';
import { formatDuration, formatTime } from './src/utils.js';

const cmd = process.argv[2] ?? '';

const commands: Record<string, () => Promise<void>> = {
  async analyze() {
    const days = parseInt(process.argv[3] ?? '30', 10);
    await createWarmupPlan(days);
  },

  async start() {
    await startDaemon();
  },

  async stop() {
    await stopDaemon();
  },

  async status() {
    const daemon = await getDaemonStatus();
    let plan: WarmupPlan | null = null;

    try {
      plan = JSON.parse(await readFile(paths.plan, 'utf-8')) as WarmupPlan;
    } catch {}

    consola.box({
      title: 'ccwarm Status',
      message: [
        `Daemon: ${daemon.running ? `Running (PID: ${daemon.pid})` : 'Stopped'}`,
        '',
        plan
          ? [
              'Warmup Plan:',
              `  Target Time: ${formatTime(plan.targetMinute)}`,
              `  Median Start: ${formatTime(plan.medianStartMinute)}`,
              `  Median Duration: ${formatDuration(plan.medianDurationMinutes)}`,
              `  Calculated: ${plan.calculatedAt}`,
            ].join('\n')
          : "No warmup plan. Run 'ccwarm analyze' first.",
      ].join('\n'),
    });
  },

  async logs() {
    await getDaemonLogs();
  },
};

const run = commands[cmd];

if (run) {
  await run();
} else {
  consola.box({
    title: 'ccwarm - Claude Auto-Warmer',
    message: [
      'Usage: ccwarm <command>',
      '',
      'Commands:',
      '  analyze [days]  Analyze usage patterns (default: 30 days)',
      '  start           Start background daemon',
      '  stop            Stop background daemon',
      '  status          Show daemon and plan status',
      '  logs            Follow daemon log output',
    ].join('\n'),
  });
}
