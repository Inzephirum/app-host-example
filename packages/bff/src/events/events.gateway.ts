import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

const getRoomId = (socket: Socket): string => socket.handshake.query.cid;

interface Message {
  channel: string;
  topic: string;
}

@WebSocketGateway()
export class EventsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() wss: Server;

  private logger = new Logger('EventsGateway');

  afterInit(): void {
    this.logger.log('Initialized');
  }

  handleConnection(client: Socket): void {
    const roomId = getRoomId(client);

    if (roomId === undefined) {
      client.disconnect(true);
      return;
    }

    client.join(roomId);

    this.logger.log(`Client ${client.id} connected to room ${roomId}`);
  }

  handleDisconnect(client: Socket): void {
    this.logger.log(`Client ${client.id} disconnected`);
  }

  @SubscribeMessage('bus')
  handleEvent(client: Socket, message: Message): void {
    const roomId = getRoomId(client);
    client.broadcast.in(roomId).emit('bus', message);
    this.logger.debug(`Message from ${roomId}:${client.id}, ${JSON.stringify(message)}`);
  }
}
