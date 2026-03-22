/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable, Inject, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, timeout } from 'rxjs';

@Injectable()
export class EmpresaTcpProxy {
  private readonly logger = new Logger(EmpresaTcpProxy.name);

  constructor(@Inject('ADMIN_SERVICE') private readonly client: ClientProxy) {}

  async getEmpresaActiva(): Promise<any> {
    try {
      // Revisa tu proxy de logistics para confirmar el patrón exacto.
      // Usualmente es un string 'get_empresa_activa' o un objeto { cmd: 'get_empresa_activa' }
      const response = await firstValueFrom(
        this.client.send('get_empresa_activa', {}).pipe(timeout(5000)), // ¡El timeout es clave!
      );
      return response?.data ? response.data : response;
    } catch (error) {
      this.logger.warn(`⚠️ Error al obtener empresa por TCP: ${error.message}`);
      return null;
    }
  }
}
