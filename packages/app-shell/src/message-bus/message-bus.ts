import { MessageBus, QueuePattern, QueueMessage, QueueListener, MessageInput } from './types';

import { Logger } from './logger';
import { BrowserMessageWorker } from './message-worker';
import { Sink } from './sink';

interface MessageBusParams {
  ws: string;
}
export class BrowserMessageBus implements MessageBus {
  private params: MessageBusParams;
  private logger = new Logger('MessageBus');
  private worker = new BrowserMessageWorker();
  private sink = new Sink();
  private clientId: string | null = null;

  static create(params: MessageBusParams): BrowserMessageBus {
    return new BrowserMessageBus(params);
  }

  private constructor(params: MessageBusParams) {
    this.params = params;
    this.worker.listen((output) => {
      if (output.type === 'message') {
        this.logger.log('Получено сообщение из воркера', output);
        this.sink.push(output);
      }

      if (output.type === 'reply') {
        this.logger.log(`Комманда "${output.meta.command}" выполнена`, {
          result: output.payload,
          input: output.meta
        })
      }
    });
  }

  setClientId(cid: string) {
    if (this.clientId !== cid) {
      this.sink.clean();
      this.clientId = cid;
    }

    const wsParams = { uri: this.params.ws, cid };

    this.logger.log('Установка соединения по сокету', wsParams);

    this.worker.send({
      command: 'setup-socket',
      payload: wsParams,
      responseWithStatus: true
    });

  }

  send(message: MessageInput): void {
    this.worker.send({ command: 'process-message', payload: message });
    this.logger.log('Отправлено сообщение', message);
  }

  peek(pattern: QueuePattern) {
    return this.sink.peek(pattern);
  }

  log(pattern: QueuePattern) {
    return this.sink.log(pattern);
  }

  subscribe<P>(pattern: QueuePattern, cb: QueueListener<P>): VoidFunction {
    return this.sink.subscribe<P>(pattern, cb);
  }
}
