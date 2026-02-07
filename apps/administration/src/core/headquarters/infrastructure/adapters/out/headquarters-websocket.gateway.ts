/* eslint-disable @typescript-eslint/no-unsafe-member-access */
//infrastructure/adapters/out/headquarters-websocket.gateway.ts
/* ============================================
   administration/src/core/headquarters/infrastructure/adapters/out/headquarters-websocket.gateway.ts
   ============================================ */
import { Inject } from '@nestjs/common';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { IHeadquartersQueryPort } from '../../../domain/ports/in/headquarters-ports-in';
import { HeadquartersResponseDto } from '../../../application/dto/out/headquarters-response-dto';

@WebSocketGateway({
  namespace: '/headquarters',
  cors: {
    origin: '*',
  },
})
export class HeadquarterWebSocketGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  constructor(
    @Inject('IHeadquartersQueryPort')
    private readonly headquartersQueryService: IHeadquartersQueryPort,
  ) {}

  handleConnection(client: Socket) {
    console.log('WS conectado: ', client.id, 'namespace: ', client.nsp.name);
    console.log(`Cliente conectado al canal Headquarters: ${client.id}`);
  }

  handleDisconnect(client: any) {
    console.log(`Cliente desconectado: ${client.id}`);
  }

  notifyHeadquarterCreated(headquarter: HeadquartersResponseDto): void {
    this.server.emit('headquarterCreated', headquarter);
  }

  notifyHeadquarterUpdated(headquarter: HeadquartersResponseDto): void {
    this.server.emit('headquarterUpdated', headquarter);
  }

  notifyHeadquarterDeleted(headquarterId: number): void {
    this.server.emit('headquarterDeleted', { id_sede: headquarterId });
  }

  notifyHeadquarterStatusChanged(headquarter: HeadquartersResponseDto) {
    this.server.emit('headquarterStatusChanged', headquarter);
  }
}
