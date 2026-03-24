/* sales/src/core/sales-receipt/infrastructure/adapters/out/TCP/empresa-tcp.proxy.ts */

import { Injectable, Inject, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, timeout } from 'rxjs';
import { EmpresaPortOut } from '../../../../domain/ports/out/empresa-port-out';
import { Empresa } from 'apps/administration/src/core/company/domain/entity/empresa.entity';

@Injectable()
export class EmpresaTcpProxy implements EmpresaPortOut {
  private readonly logger = new Logger(EmpresaTcpProxy.name);

  constructor(@Inject('ADMIN_SERVICE') private readonly client: ClientProxy) {}

  // CAMBIA EL NOMBRE AQUÍ PARA QUE COINCIDA CON EL SERVICIO
  async getEmpresa(id: number): Promise<any> {
    try {
      const response = await firstValueFrom(
        // Usamos el patrón string 'get_empresa_activa' que ya tienes en el controller
        this.client.send('get_empresa_activa', { id }).pipe(timeout(5000)),
      );

      // Como tu controller de Admin responde con { ok: true, data: ... }
      // debemos retornar solo la propiedad data.
      if (response && response.ok) {
        return response.data;
      }
      
      return response; 
    } catch (error) {
      this.logger.error(`❌ Error al obtener empresa por TCP: ${error.message}`);
      return null;
    }
  }

  // Puedes mantener este si lo usas en otro lugar
  async getEmpresaActiva(): Promise<any> {
     return this.getEmpresa(1);
  }
}