/* ============================================
   administration/src/core/cashbox/infrastructure/adapters/cashbox-websocket.gateway.ts
   ============================================ */
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Inject, Injectable } from '@nestjs/common';
import { ICashboxQueryPort } from '../../../domain/ports/in/cashbox-ports-in';
import { CashboxResponseDto } from '../../../application/dto/out';

@WebSocketGateway({
  namespace: '/cashbox',
  cors: { origin: '*' },
})
@Injectable()
export class CashboxWebSocketGateway implements OnGatewayConnection {
  @WebSocketServer()
  server: Server;

  constructor(
    @Inject('ICashboxQueryPort')
    private readonly cashboxQueryService: ICashboxQueryPort,
  ) {}

  handleConnection(client: Socket) {
    console.log(`💰 Cliente conectado a Cashbox Control: ${client.id}`);
  }

  // --- ESCUCHA DE EVENTOS (Client -> Server) ---

  @SubscribeMessage('checkActiveSession')
  async handleCheckActiveSession(
    @MessageBody() data: { id_sede: number },
    @ConnectedSocket() client: Socket,
  ): Promise<CashboxResponseDto | { active: boolean }> {
    try {
      const activeBox = await this.cashboxQueryService.findActiveBySede(data.id_sede);
      return activeBox ? activeBox : { active: false };
    } catch (error) {
      client.emit('error', { message: 'Error al consultar sesión activa' });
      throw error;
    }
  }

  // --- EMISIÓN DE EVENTOS (Server -> Client) ---

  notifyCashboxOpened(cashbox: CashboxResponseDto): void {
    // Notifica a todos los admins que una sede abrió caja
    this.server.emit('cashbox.opened', cashbox);
  }

  notifyCashboxClosed(cashbox: CashboxResponseDto): void {
    // Notifica el cierre para auditoría inmediata
    this.server.emit('cashbox.closed', cashbox);
  }
}