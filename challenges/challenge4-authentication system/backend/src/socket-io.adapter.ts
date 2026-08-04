import { IoAdapter } from '@nestjs/platform-socket.io';
import { ServerOptions } from 'socket.io';
import { INestApplication } from '@nestjs/common';

export class CustomSocketIoAdapter extends IoAdapter {
  constructor(private readonly app: INestApplication) {
    super(app);
  }

  createIOServer(port: number, options?: ServerOptions) {
    const server = super.createIOServer(port, {
      ...options,
      cors: {
        origin: '*',
        methods: ['GET', 'POST'],
        credentials: true,
      },
      allowEIO3: true,
      transports: ['websocket', 'polling'],
    });

    return server;
  }
}
