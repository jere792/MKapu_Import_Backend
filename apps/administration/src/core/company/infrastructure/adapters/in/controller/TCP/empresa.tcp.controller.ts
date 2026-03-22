/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Controller, Logger, Inject } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { EmpresaMapper } from 'apps/administration/src/core/company/application/mapper/empresa.mapper';
// Importa tu mapper (Ajusta la ruta según tu estructura)

@Controller()
export class EmpresaTcpController {
  private readonly logger = new Logger(EmpresaTcpController.name);

  constructor(
    @Inject('GET_EMPRESA_USE_CASE')
    private readonly getEmpresaService: any,
  ) {}

  @MessagePattern('get_empresa_activa')
  async getEmpresaActiva() {
    this.logger.log(
      '📡 [TCP] Solicitud recibida en Administración: get_empresa_activa',
    );
    try {
      // 1. Obtiene la entidad de dominio
      const empresaDomain = await this.getEmpresaService.execute();

      if (!empresaDomain) {
        return { ok: true, data: null };
      }

      // 2. Mapea la entidad de dominio a DTO plano
      // Asumiendo que tu mapper tiene un método toResponseDto o toDto
      const dto = EmpresaMapper.toResponse(empresaDomain);

      // 3. Retorna el DTO
      return { ok: true, data: dto };
    } catch (error: any) {
      this.logger.error(
        `❌ Error al consultar empresa en Administración: ${error.message}`,
      );
      return { ok: false, message: error.message, data: null };
    }
  }
}
