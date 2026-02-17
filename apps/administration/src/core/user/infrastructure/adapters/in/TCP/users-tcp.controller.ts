import { Controller, Inject, Logger, UseGuards } from '@nestjs/common';
import { MessagePattern, Payload, RpcException } from '@nestjs/microservices';
import { IUserQueryPort } from '../../../../domain/ports/in/user-port-in';
import { InternalSecretGuard } from '../guards/internal-secret.guard';

type FindUsersByIdsPayload = {
  ids: number[] | string[];
  secret?: string;
};

type FindUsersByIdsResponse = {
  ok: boolean;
  data?: Array<{
    id_usuario: number;
    nombres: string;
    ape_pat?: string;
    ape_mat?: string;
    nombreCompleto: string;
  }>;
  message?: string;
};

@Controller()
export class UsersTcpController {
  private readonly logger = new Logger(UsersTcpController.name);

  constructor(
    @Inject('IUserQueryPort')
    private readonly userQueryPort: IUserQueryPort,
  ) {}

  @UseGuards(InternalSecretGuard) 
  @MessagePattern('users.findByIds')
  async findByIds(@Payload() payload: FindUsersByIdsPayload): Promise<FindUsersByIdsResponse> {
    try {
      this.logger.log(`📡 [TCP] users.findByIds recibido con ${payload?.ids?.length ?? 0} ID(s)`);

      // Validar y normalizar IDs
      const idsRaw = payload?.ids ?? [];
      const ids = Array.isArray(idsRaw)
        ? idsRaw.map((v) => Number(String(v).trim())).filter((n) => !Number.isNaN(n) && n > 0)
        : [];

      if (ids.length === 0) {
        this.logger.warn('⚠️ No se recibieron IDs válidos');
        return { ok: true, data: [] };
      }

      // Validar límite de IDs (prevenir consultas masivas)
      if (ids.length > 100) {
        this.logger.warn(`⚠️ Solicitud excede límite: ${ids.length} IDs (máx: 100)`);
        return { 
          ok: false, 
          message: 'Demasiados IDs solicitados. Máximo: 100',
          data: null 
        };
      }

      // Consultar usuarios
      const users = await this.userQueryPort.findByIds!(ids);

      if (!users) {
        this.logger.error('❌ userQueryPort.findByIds retornó null/undefined');
        return { 
          ok: false, 
          message: 'Error interno al consultar usuarios',
          data: null 
        };
      }

      // Mapear respuesta
      const data = users.map((u: any) => ({
        id_usuario: u.id_usuario,
        nombres: u.nombres,
        ape_pat: u.ape_pat,
        ape_mat: u.ape_mat,
        nombreCompleto: `${u.nombres ?? ''} ${u.ape_pat ?? ''} ${u.ape_mat ?? ''}`.trim(),
      }));

      this.logger.log(`✅ Retornando ${data.length} usuario(s)`);
      return { ok: true, data };

    } catch (error: any) {
      this.logger.error(`❌ Error en users.findByIds: ${error?.message}`, error?.stack);
      
      // En TCP, es mejor retornar una respuesta controlada que lanzar excepción
      return { 
        ok: false, 
        message: `Error al procesar solicitud: ${error?.message ?? 'Error desconocido'}`,
        data: null 
      };
    }
  }
}