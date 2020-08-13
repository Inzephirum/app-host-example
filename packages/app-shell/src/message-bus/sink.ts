import { Queue } from './queue';
import { QueueMessage, QueueListener, QueuePattern, Unsubscribe, WorkerOutput } from './types';

type QueueKey = string;
type Filter<T, U> = T extends U ? T : never;

class QueueNotifier {
  listeners: Set<Function> = new Set();

  notify(message: QueueMessage) {
    this.listeners.forEach((listener) => {
      listener(message);
    });
  }

  addListener(listener: QueueListener): Unsubscribe {
    this.listeners.add(listener);

    return () => {
      this.listeners.delete(listener);
    };
  }

  removeAllListeners() {
    this.listeners.clear();
  }
}

interface QueueBucket {
  queue: Queue;
  notifier: QueueNotifier;
}

export class Sink {
  private buckets: Map<QueueKey, QueueBucket>;

  private static getQueueKey(pattern: QueuePattern): string {
    return `${pattern.channel}:${pattern.topic}`;
  }

  constructor() {
    this.buckets = new Map();
  }

  private useBucket(pattern: QueuePattern): QueueBucket {
    const queueKey = Sink.getQueueKey(pattern);

    if (this.buckets.has(queueKey)) {
      return this.buckets.get(queueKey);
    }

    const queue = new Queue(10);
    const notifier = new QueueNotifier();
    const bucket = { queue, notifier };

    this.buckets.set(queueKey, bucket);

    return bucket;
  }

  push(output: Filter<WorkerOutput, { type: 'message' }>) {
    const message = output.payload;
    const pattern = { channel: message.channel, topic: message.topic };
    const bucket = this.useBucket(pattern);

    const queueMessage = { payload: message.payload, params: output.meta };

    bucket.queue.enqueue(queueMessage);
    bucket.notifier.notify(queueMessage);
  }

  peek(pattern: QueuePattern): QueueMessage | void {
    return this.useBucket(pattern).queue.peek();
  }

  log(pattern: QueuePattern): QueueMessage[] {
    return this.useBucket(pattern).queue.toArray();
  }

  clean(): void {
    this.buckets.forEach((bucket) => {
      bucket.queue.clean();
    });
  }

  subscribe<P>(pattern: QueuePattern, cb: QueueListener<P>): Unsubscribe {
    const bucket = this.useBucket(pattern);
    return bucket.notifier.addListener(cb);
  }
}
