/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Inject } from '@nestjs/common';
import { IRoleQueryPort } from '../../../domain/ports/in/role-port-in';
import { ListRoleFilterDto } from '../../../application/dto/in';
import {
  RoleResponseDto,
  RoleListResponse,
} from '../../../application/dto/out';

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: 'roles',
})
export class RoleWebSocketGateway {
  @WebSocketServer()
  server: Server;

  constructor(
    @Inject('IRoleQueryPort')
    private readonly roleQueryService: IRoleQueryPort,
  ) {}

  @SubscribeMessage('listRoles')
  async handleListRoles(
    @MessageBody() filters: ListRoleFilterDto,
    @ConnectedSocket() client: Socket,
  ): Promise<RoleListResponse> {
    try {
      return await this.roleQueryService.listRoles(filters);
    } catch (error) {
      client.emit('error', { event: 'listRoles', message: error.message });
      throw error;
    }
  }

  @SubscribeMessage('getRoleById')
  async handleGetRoleById(
    @MessageBody() data: { id: number },
    @ConnectedSocket() client: Socket,
  ): Promise<RoleResponseDto | null> {
    try {
      return await this.roleQueryService.getRoleById(data.id);
    } catch (error) {
      client.emit('error', { event: 'getRoleById', message: error.message });
      throw error;
    }
  }

  @SubscribeMessage('getRoleByName')
  async handleGetRoleByName(
    @MessageBody() data: { nombre: string },
    @ConnectedSocket() client: Socket,
  ): Promise<RoleResponseDto | null> {
    try {
      return await this.roleQueryService.getRoleByName(data.nombre);
    } catch (error) {
      client.emit('error', { event: 'getRoleByName', message: error.message });
      throw error;
    }
  }

  notifyRoleCreated(role: RoleResponseDto): void {
    this.server.emit('roleCreated', role);
  }

  notifyRoleUpdated(role: RoleResponseDto): void {
    this.server.emit('roleUpdated', role);
  }

  notifyRoleDeleted(roleId: number): void {
    this.server.emit('roleDeleted', { id_rol: roleId });
  }

  notifyRoleStatusChanged(role: RoleResponseDto): void {
    this.server.emit('roleStatusChanged', role);
  }
  notifyRolePermissionsChanged(roleId: number) {
    this.server.emit('role_permissions_updated', { roleId });
  }
}
