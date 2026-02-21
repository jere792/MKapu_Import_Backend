/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  ExecutionContext,
  Injectable,
  CanActivate,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorators';

@Injectable()
export class RoleGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  private readonly rolePermissions = {
    VENDEDOR: [
      'REGISTRAR_VENTA',
      'GENERAR_COTIZACION',
      'BUSCAR_PRODUCTOS',
      'REGISTRAR_RECLAMO',
      'REGISTRAR_GARANTIA',
    ],
    CAJERO: [
      'ABRIR_CAJA',
      'CERRAR_CAJA',
      'GESTIONAR_CAJA_CHICA',
      'GENERAR_COTIZACION',
      'BUSCAR_PRODUCTOS',
    ],
    ALMACENERO: [
      'VER_STOCK',
      'REGISTRAR_ENTRADA',
      'REGISTRAR_SALIDA',
      'VER_MOVIMIENTOS',
      'CLASIFICAR_PRODUCTO',
    ],
    'JEFE DE ALMACEN': [
      'VER_STOCK',
      'REGISTRAR_ENTRADA',
      'REGISTRAR_SALIDA',
      'APROBAR_GARANTIA',
      'VER_MOVIMIENTOS',
    ],
    ADMINISTRADOR: ['*'],
  };

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();

    if (!user || !user.roles) {
      throw new ForbiddenException(
        'El usuario no tiene roles asignados o no está autenticado',
      );
    }

    const hasRole = () =>
      user.roles.some((role: string) => requiredRoles.includes(role));

    if (!hasRole()) {
      throw new ForbiddenException(
        `Se requiere uno de estos roles: ${requiredRoles.join(', ')}`,
      );
    }

    return true;
  }
}
