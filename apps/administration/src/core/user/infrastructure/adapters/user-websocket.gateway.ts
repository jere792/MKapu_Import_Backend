/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* ============================================
   administration/src/core/user/infrastructure/adapters/user-websocket.gateway.ts
   ============================================ */

import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Inject } from '@nestjs/common';
import { IUserQueryPort } from '../../domain/ports/in/user-port-in';
import { ListUserFilterDto } from '../../application/dto/in';
import { UserResponseDto, UserListResponse } from '../../application/dto/out';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: '/users',
})
export class UserWebSocketGateway {
  @WebSocketServer()
  server: Server;

  constructor(
    @Inject('IUserQueryPort')
    private readonly userQueryService: IUserQueryPort,
  ) {}

  @SubscribeMessage('listUsers')
  async handleListUsers(
    @MessageBody() filters: ListUserFilterDto,
    @ConnectedSocket() client: Socket,
  ): Promise<UserListResponse> {
    try {
      const result = await this.userQueryService.listUsers(filters);
      return result;
    } catch (error) {
      client.emit('error', {
        event: 'listUsers',
        message: error.message,
      });
      throw error;
    }
  }

  @SubscribeMessage('getUserById')
  async handleGetUserById(
    @MessageBody() data: { id: number },
    @ConnectedSocket() client: Socket,
  ): Promise<UserResponseDto | null> {
    try {
      const result = await this.userQueryService.getUserById(data.id);
      return result;
    } catch (error) {
      client.emit('error', {
        event: 'getUserById',
        message: error.message,
      });
      return { error: error.message } as any;
    }
  }

  @SubscribeMessage('getUserByDni')
  async handleGetUserByDni(
    @MessageBody() data: { dni: string },
    @ConnectedSocket() client: Socket,
  ): Promise<UserResponseDto | null> {
    try {
      const result = await this.userQueryService.getUserByDni(data.dni);
      return result;
    } catch (error) {
      client.emit('error', {
        event: 'getUserByDni',
        message: error.message,
      });
      return { error: error.message } as any;
    }
  }

  @SubscribeMessage('getUserByEmail')
  async handleGetUserByEmail(
    @MessageBody() data: { email: string },
    @ConnectedSocket() client: Socket,
  ): Promise<UserResponseDto | null> {
    try {
      const result = await this.userQueryService.getUserByEmail(data.email);
      return result;
    } catch (error) {
      client.emit('error', {
        event: 'getUserByEmail',
        message: error.message,
      });
      throw error;
    }
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
}
