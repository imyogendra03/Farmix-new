let Queue;
let Worker;
let QueueEvents;
let IORedis;

try {
  ({ Queue, Worker, QueueEvents } = require('bullmq'));
  IORedis = require('ioredis');
} catch (error) {
  // Optional dependency path; queue gracefully falls back to inline sends.
}

class EmailQueueService {
  constructor() {
    this.enabled = false;
    this.queue = null;
    this.deadLetterQueue = null;
    this.worker = null;
    this.queueEvents = null;
    this.connection = null;
    this.processor = null;
    this.initialized = false;
  }

  async init(processor) {
    if (this.initialized) {
      return;
    }

    this.processor = processor;

    const queueEnabled = String(process.env.EMAIL_QUEUE_ENABLED || '').toLowerCase() === 'true';
    const redisUrl = process.env.REDIS_URL;
    if (!queueEnabled || !redisUrl || !Queue || !Worker || !QueueEvents || !IORedis) {
      this.initialized = true;
      this.enabled = false;
      console.log('[EMAIL QUEUE] Running inline mode (queue disabled or Redis/dependencies unavailable).');
      return;
    }

    const attempts = Number(process.env.EMAIL_QUEUE_ATTEMPTS || 3);
    const backoffDelay = Number(process.env.EMAIL_QUEUE_BACKOFF_MS || 5000);
    const concurrency = Number(process.env.EMAIL_QUEUE_CONCURRENCY || 2);

    try {
      this.connection = new IORedis(redisUrl, {
        maxRetriesPerRequest: null,
        enableReadyCheck: false
      });

      this.queue = new Queue('email-jobs', {
        connection: this.connection,
        defaultJobOptions: {
          attempts,
          backoff: {
            type: 'exponential',
            delay: backoffDelay
          },
          removeOnComplete: true,
          removeOnFail: false
        }
      });

      this.deadLetterQueue = new Queue('email-dead-letter', {
        connection: this.connection,
        defaultJobOptions: {
          removeOnComplete: true,
          removeOnFail: false
        }
      });

      this.queueEvents = new QueueEvents('email-jobs', { connection: this.connection });
      await this.queueEvents.waitUntilReady();

      this.worker = new Worker(
        'email-jobs',
        async (job) => {
          if (!this.processor) {
            throw new Error('Email queue processor is not configured');
          }
          return this.processor(job.data);
        },
        {
          connection: this.connection,
          concurrency
        }
      );

      this.worker.on('failed', async (job, error) => {
        console.error(`[EMAIL QUEUE] Job ${job?.id || 'unknown'} failed: ${error.message}`);

        if (!job) {
          return;
        }

        const maxAttempts = job.opts?.attempts || attempts;
        if (job.attemptsMade >= maxAttempts && this.deadLetterQueue) {
          await this.deadLetterQueue.add('dead-email', {
            payload: job.data,
            error: error.message,
            failedAt: new Date().toISOString(),
            attemptsMade: job.attemptsMade
          });
        }
      });

      this.enabled = true;
      this.initialized = true;
      console.log('[EMAIL QUEUE] BullMQ worker started.');
    } catch (error) {
      this.enabled = false;
      this.initialized = true;
      console.error(`[EMAIL QUEUE] Redis setup failed, using inline mode: ${error.message}`);
      await this.close();
    }
  }

  async enqueue(payload) {
    if (!this.initialized) {
      throw new Error('Email queue is not initialized');
    }

    if (!this.enabled || !this.queue) {
      return this.processor(payload);
    }

    const job = await this.queue.add('send-email', payload);
    return {
      status: 'queued',
      jobId: job.id
    };
  }

  async close() {
    const closers = [
      this.worker?.close?.(),
      this.queueEvents?.close?.(),
      this.queue?.close?.(),
      this.deadLetterQueue?.close?.(),
      this.connection?.quit?.()
    ].filter(Boolean);

    await Promise.allSettled(closers);
  }

  getStatus() {
    return {
      mode: this.enabled ? 'queue' : 'inline',
      initialized: this.initialized
    };
  }
}

module.exports = new EmailQueueService();
