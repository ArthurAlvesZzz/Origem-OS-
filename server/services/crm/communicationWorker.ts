import prisma from '../../lib/prisma';
import { communicationDispatcher } from './communicationDispatcher';

let isRunning = false;
let workerTimer: NodeJS.Timeout | null = null;
let lastDispatchAttempt = new Date();

export function startCommunicationWorker() {
  const enabled = process.env.COMMUNICATION_WORKER_ENABLED === 'true'; // Enable explicitly in prod
  if (!enabled) {
    console.log('[Worker] Communication worker is disabled via env. Use manual process-once.');
    return;
  }
  
  const interval = parseInt(process.env.COMMUNICATION_WORKER_INTERVAL_MS || '10000', 10);
  console.log(`[Worker] Started communication worker (${interval}ms)`);
  
  workerTimer = setInterval(async () => {
    if (isRunning) return;
    isRunning = true;
    
    try {
      lastDispatchAttempt = new Date();
      await communicationDispatcher.processQueue();
    } catch (err) {
      console.error('[Worker] Error processing queue:', err);
    } finally {
      isRunning = false;
    }
  }, interval);
}

export function stopCommunicationWorker() {
  if (workerTimer) {
    clearInterval(workerTimer);
    workerTimer = null;
  }
}

export function getWorkerDiagnostics() {
  return {
    isRunning,
    enabled: process.env.COMMUNICATION_WORKER_ENABLED === 'true',
    lastDispatchAttempt
  };
}
