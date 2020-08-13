import { connect,  } from 'socket.io-client';
import { Message, Unsubscribe } from './types';

interface WSParams {
  uri: string;
  cid: string;
}

type ConnectionResult =
  | { status: true; params: WSParams }
  | { status: false; params: WSParams; error: object };

interface ResultCallback {
  (result: ConnectionResult): void;
}

export class WSClient {
  private socket: ReturnType<typeof connect>;
  private lastConnectionParams: WSParams | null;

  constructor() {
    this.lastConnectionParams = null;
    this.socket = connect({
      autoConnect: false,
      reconnectionAttempts: 5,
      transports: ['websocket'],
    });
  }

  private needReconnect(params: WSParams): boolean {
    return Object.keys(params).some((key) => params[key] !== this.lastConnectionParams[key]);
  }

  connect(params: WSParams, cb?: ResultCallback) {
    if (this.lastConnectionParams !== null) {
      if (this.needReconnect(params)) {
        this.socket.disconnect();
      } else {
        return;
      }
    }

    this.lastConnectionParams = params;

    this.socket.io.uri = params.uri;
    this.socket.io.opts.query = { cid: params.cid };

    this.socket.connect();

    if (typeof connect !== 'function') {
      return;
    }

    this.socket.on('connect', () => {
      cb({ status: true, params });
    });

    this.socket.on('connect_error', (error: object) => {
      cb({ status: false, params, error });
    });
  }

  send(message: Message) {
    this.socket.emit('bus', message);
  }

  subscribe(cb: (message: Message) => void): Unsubscribe {
    this.socket.on('bus', cb);
    return () => {
      this.socket.off('bus', cb);
    };
  }
}
