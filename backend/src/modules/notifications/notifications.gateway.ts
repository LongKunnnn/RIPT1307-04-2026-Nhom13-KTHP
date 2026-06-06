import { WebSocketGateway, WebSocketServer, OnGatewayConnection } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({ 
  cors: { origin: '*' }, 
  namespace: '/notifications' 
})
export class NotificationsGateway implements OnGatewayConnection {
  @WebSocketServer()
  server!: Server;

  handleConnection(client: Socket) {
    const userId = client.handshake.query.userId;
    if (userId) {
      client.join(userId.toString());
      console.log(`User ${userId} đã vào phòng, socket: ${client.id}`);
    }
  }


  sendToUser(userId: number, notification: any) {
    this.server.to(userId.toString()).emit('new_notification', notification);
  }
}