import { WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({ 
  cors: { origin: '*' }, 
  namespace: '/notifications' 
})
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  // Bản đồ lưu vết: userId -> socketId
  private userSockets = new Map<number, string>();

  handleConnection(client: Socket) {
    // Lấy userId từ chuỗi query lúc Frontend kết nối (VD: ws://...?userId=1)
    const userId = Number(client.handshake.query.userId);
    if (userId) {
      this.userSockets.set(userId, client.id);
    }
  }

  handleDisconnect(client: Socket) {
    const userId = Number(client.handshake.query.userId);
    if (userId) {
      this.userSockets.delete(userId);
    }
  }

  // CÁI NÀY QUAN TRỌNG: Hàm dùng để bắn tín hiệu lên Frontend
  sendToUser(userId: number, notification: any) {
    const socketId = this.userSockets.get(userId);
    if (socketId) {
      this.server.to(socketId).emit('new_notification', notification);
    }
  }
}