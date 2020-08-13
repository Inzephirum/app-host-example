import type { Message, WorkerInputMessageEvent, WorkerOutput } from './types';
import { WSClient } from './ws-client';

const worker = (self as unknown) as SharedWorkerGlobalScope;

class Hub {
  private ports: Set<MessagePort>;

  constructor() {
    this.ports = new Set();
  }

  public connect(port: MessagePort): void {
    this.ports.add(port);
  }

  public disconnect(port: MessagePort): void {
    try {
      port.close();
    } finally {
      this.ports.delete(port);
    }
  }

  public notify(output: WorkerOutput, options: { exclude?: MessagePort } = {}) {
    this.ports.forEach((port) => {
      if (port !== options.exclude) {
        port.postMessage(output);
      }
    });
  }
}

const ws = new WSClient();
const hub = new Hub();

ws.subscribe((message) => {
  hub.notify({ type: 'message', payload: message, meta: { broadcast: true, self: false } });
});

worker.addEventListener('connect', (e) => {
  const [port] = e.ports;

  hub.connect(port);

  port.addEventListener('message', (event: WorkerInputMessageEvent) => {
    const input = event.data;

    if (input.command === 'process-message') {
      const inputMessage = input.payload;

      const message = {
        channel: inputMessage.channel,
        topic: inputMessage.topic,
        payload: inputMessage.payload,
      };

      const params = {
        broadcast: inputMessage.broadcast ?? false,
        self: inputMessage.self ?? false,
      };

      hub.notify(
        { type: 'message', payload: message, meta: params },
        { exclude: params.self === false ? port : undefined },
      );

      if (params.broadcast) {
        ws.send(message);
      }

      return;
    }

    if (input.command === 'setup-socket') {
      ws.connect(input.payload, (result) => {
        if (input.responseWithStatus === true) {
          hub.notify({ type: 'reply', payload: result, meta: input });
        }
      });
    }

    if (input.command === 'close') {
      hub.disconnect(port);
    }
  });

  port.start();
});
