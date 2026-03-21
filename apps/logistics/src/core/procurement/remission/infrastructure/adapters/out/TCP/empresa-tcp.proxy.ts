/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, timeout } from 'rxjs';
import {
  EmpresaTcpPortOut,
  EmpresaInfoResponse,
} from '../../../../domain/ports/out/empresa-tcp.port';

@Injectable()
export class EmpresaTcpProxy implements EmpresaTcpPortOut {
  private readonly logger = new Logger(EmpresaTcpProxy.name);

  constructor(
    @Inject('ADMIN_SERVICE')
    private readonly adminClient: ClientProxy,
  ) {}

  async getEmpresaData(): Promise<EmpresaInfoResponse | null> {
    try {
      this.logger.log(
        '📡 Solicitando datos de la Empresa a Administración por TCP...',
      );
      const response = await firstValueFrom(
        this.adminClient.send('get_empresa_activa', {}).pipe(timeout(5000)),
      );

      if (!response || response.ok === false) {
        this.logger.error(
          `❌ El servidor devolvió error: ${response?.message || 'Sin mensaje'}`,
        );
        return null;
      }

      return response.data as EmpresaInfoResponse;
    } catch (error: any) {
      const errorMsg =
        typeof error === 'string'
          ? error
          : error?.message || JSON.stringify(error);
      this.logger.error(
        `❌ Error de conexión TCP al buscar empresa: ${errorMsg}`,
      );
      return null;
    }
  }
}
