/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Controller, Logger, Inject } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';

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
      const response = await this.getEmpresaService.execute();

      const dataEmpresa = response?.data ? response.data : response;

      return { ok: true, data: dataEmpresa };
    } catch (error: any) {
      this.logger.error(
        `❌ Error al consultar empresa en Administración: ${error.message}`,
      );
      return { ok: false, message: error.message, data: null };
    }
  }
}
