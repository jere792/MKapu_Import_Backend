/* apps/sales/src/core/sales-receipt/infrastructure/adapters/out/TCP/admin-tcp.proxy.ts */

import { Injectable, Inject, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, timeout, catchError } from 'rxjs';
import { of } from 'rxjs';

type GetUserByIdReply =
  | { ok: true; data: { id_usuario: number; usu_nom: string; ape_pat: string; ape_mat: string } | null }
  | { ok: false; message?: string; data?: null };

type GetSedeByIdReply =
  | { ok: true; data: { id_sede: number; nombre: string } | null }
  | { ok: false; message?: string; data?: null };

@Injectable()
export class AdminTcpProxy {
  private readonly logger = new Logger(AdminTcpProxy.name);

  constructor(
    @Inject('ADMIN_SERVICE')
    private readonly client: ClientProxy,
  ) {}

  async getUserById(id_usuario: string | number): Promise<{ 
    id_usuario: number; 
    usu_nom: string; 
    ape_pat: string; 
    ape_mat: string;
  } | null> {
    try {
      this.logger.log(`📡 [TCP] Consultando usuario con id: ${id_usuario}`);

      const response = await firstValueFrom(
        this.client
          .send<GetUserByIdReply>('get_user_by_id', { id_usuario: String(id_usuario) })
          .pipe(
            timeout(5000),
            catchError((error) => {
              this.logger.error(`❌ Error TCP al consultar usuario ${id_usuario}: ${error.message}`);
              return of({ ok: false, data: null });
            })
          ),
      );

      const user = (response as any)?.data ?? null;

      if (user) {
        this.logger.log(`✅ Usuario encontrado: ${user.usu_nom} ${user.ape_pat}`);
      } else {
        this.logger.warn(`⚠️ Usuario ${id_usuario} no encontrado`);
      }

      return user;
    } catch (error: any) {
      this.logger.error(`❌ Error inesperado al consultar usuario ${id_usuario}: ${error?.message ?? error}`);
      return null;
    }
  }

  async getSedeById(id_sede: number): Promise<{ 
    id_sede: number; 
    nombre: string;
  } | null> {
    try {
      this.logger.log(`📡 [TCP] Consultando sede con id: ${id_sede}`);

      const response = await firstValueFrom(
        this.client
          .send<GetSedeByIdReply>('get_sede_by_id', { id_sede: String(id_sede) })
          .pipe(
            timeout(5000),
            catchError((error) => {
              this.logger.error(`❌ Error TCP al consultar sede ${id_sede}: ${error.message}`);
              return of({ ok: false, data: null });
            })
          ),
      );

      const sede = (response as any)?.data ?? null;

      if (sede) {
        this.logger.log(`✅ Sede encontrada: ${sede.nombre}`);
      } else {
        this.logger.warn(`⚠️ Sede ${id_sede} no encontrada`);
      }

      return sede;
    } catch (error: any) {
      this.logger.error(`❌ Error inesperado al consultar sede ${id_sede}: ${error?.message ?? error}`);
      return null;
    }
  }

  async onModuleDestroy() {
    await this.client.close();
  }
}
