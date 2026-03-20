/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Injectable, Inject, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, timeout } from 'rxjs';

// 1. Actualizamos el tipo para que acepte la data completa
type GetSedeByIdFullReply =
  | {
      ok: true;
      data: {
        id_sede: number;
        nombre: string;
        direccion?: string;
        telefono?: string;
      } | null;
    }
  | { ok: false; message?: string; data?: null };

@Injectable()
export class SedeTcpProxy {
  private readonly logger = new Logger(SedeTcpProxy.name);

  constructor(
    @Inject('SEDE_SERVICE')
    private readonly client: ClientProxy,
  ) {}

  async getSedeById(id_sede: string): Promise<{
    id_sede: number;
    nombre: string;
    direccion?: string;
    telefono?: string;
  } | null> {
    try {
      this.logger.log(`📡 Consultando sede COMPLETA con id: ${id_sede}`);

      const response = await firstValueFrom(
        this.client
          .send<GetSedeByIdFullReply>('get_sede_by_id_full', { id_sede })
          .pipe(timeout(5000)),
      );

      if (response.ok === false) {
        this.logger.error(
          `❌ El microservicio devolvió error: ${response.message ?? 'Sin mensaje'}`,
        );
        return null;
      }

      const sede = response.data ?? null;
      this.logger.log(
        `✅ Respuesta sede full: ok=${response.ok} nombre=${sede?.nombre ?? 'null'}`,
      );
      return sede;
    } catch (error: any) {
      this.logger.error(
        `❌ Error al consultar sede full ${id_sede}: ${error?.message ?? error}`,
      );
      return null;
    }
  }
}
