import { Server as SocketIOServer } from 'socket.io';
import type { Server as HttpServer } from 'node:http';

let io: SocketIOServer | null = null;

export function iniciarSocket(httpServer: HttpServer) {
  io = new SocketIOServer(httpServer, {
    cors: { origin: '*' },
  });

  io.on('connection', (socket) => {
    console.log(`Dashboard conectado: ${socket.id}`);
    socket.on('disconnect', () => {
      console.log(`Dashboard desconectado: ${socket.id}`);
    });
  });

  return io;
}

export function notificarDashboard(motivo: string) {
  io?.emit('dashboard:atualizar', { motivo, timestamp: new Date().toISOString() });
}
