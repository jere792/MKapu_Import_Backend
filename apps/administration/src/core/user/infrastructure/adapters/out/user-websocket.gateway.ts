/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable prettier/prettier */
/* ============================================
   administration/src/core/user/infrastructure/adapters/user-websocket.gateway.ts
   ============================================ */

import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Inject } from '@nestjs/common';
import { IUserQueryPort } from '../../../domain/ports/in/user-port-in';
import { UserResponseDto } from '../../../application/dto/out/user-response-dto';

@WebSocketGateway({
  namespace: '/users',
  cors: {
    origin: '*',
  },
})
export class UserWebSocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    @Inject('IUserQueryPort')
    private readonly userQueryService: IUserQueryPort,
  ) {}

  handleConnection(client: Socket) {
    console.log(`✅ Cliente conectado al canal Users: ${client.id}`);
    
    this.server.emit('userCreated', {
      id_usuario: 0,
      nombre: 'Sistema MKapu',
      email: 'admin@mkapu.com',
      estado: true,
      mensaje: 'Conexión exitosa a través del Gateway'
    });
  }

  handleDisconnect(client: any) {
    console.log(`❌ Cliente desconectado: ${client.id}`);
  }

  notifyUserCreated(user: UserResponseDto): void {
    this.server.emit('userCreated', user);
  }

  notifyUserUpdated(user: UserResponseDto): void {
    this.server.emit('userUpdated', user);
  }

  notifyUserDeleted(userId: number): void {
    this.server.emit('userDeleted', { id_usuario: userId });
  }

  notifyUserStatusChanged(user: UserResponseDto): void {
    this.server.emit('userStatusChanged', user);
  }


  @SubscribeMessage('listUsers')
  async handleListUsers(
    @MessageBody() filters: any,
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const result = await this.userQueryService.listUsers(filters);
      return result;
    } catch (error) {
      client.emit('error', { event: 'listUsers', message: error.message });
    }
  }

  @SubscribeMessage('getUserById')
  async handleGetUserById(
    @MessageBody() data: { id: number },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      return await this.userQueryService.getUserById(data.id);
    } catch (error) {
      client.emit('error', { event: 'getUserById', message: error.message });
    }
  }

}