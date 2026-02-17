import { Injectable, Inject, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, timeout } from 'rxjs';

type GetSedeByIdReply =
  | { ok: true; data: { id_sede: number; nombre: string } | null }
  | { ok: false; message?: string; data?: null };

@Injectable()
export class SedeTcpProxy {
  private readonly logger = new Logger(SedeTcpProxy.name);

  constructor(
    @Inject('SEDE_SERVICE')
    private readonly client: ClientProxy,
  ) {}

  /**
   * Devuelve SOLO la data (o null) para uso simple en services:
   * - { id_sede, nombre } | null
   */
  async getSedeById(
    id_sede: string,
  ): Promise<{ id_sede: number; nombre: string } | null> {
    try {
      this.logger.log(`📡 Consultando sede con id: ${id_sede}`);

      const response = await firstValueFrom(
        this.client
          .send<GetSedeByIdReply>('get_sede_by_id', { id_sede })
          .pipe(timeout(5000)),
      );

      const sede = (response as any)?.data ?? null;

      this.logger.log(
        `Respuesta sede: ok=${(response as any)?.ok} nombre=${sede?.nombre ?? 'null'}`,
      );

      return sede;
    } catch (error: any) {
      this.logger.error(
        `Error al consultar sede ${id_sede}: ${error?.message ?? error}`,
      );
      return null;
    }
  }
}