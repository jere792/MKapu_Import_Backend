import {
  Injectable,
  Inject,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, timeout as rxTimeout } from 'rxjs';

type FindUsersByIdsReply =
  | {
      ok: true;
      data: Array<{
        id_usuario: number;
        nombres: string;
        ape_pat?: string;
        ape_mat?: string;
        nombreCompleto?: string;
      }>;
    }
  | { ok: false; message?: string; data?: null };

@Injectable()
export class UsuarioTcpProxy implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(UsuarioTcpProxy.name);

  constructor(
    @Inject('USERS_SERVICE')
    private readonly client: ClientProxy,
  ) {}

  async onModuleInit(): Promise<void> {
    try {
      await this.client.connect();
    } catch (error: unknown) {
      this.logger.warn(
        `No se pudo conectar a USERS_SERVICE: ${
          error instanceof Error ? error.message : 'error desconocido'
        }`,
      );
    }
  }

  async onModuleDestroy(): Promise<void> {
    try {
      await this.client.close();
    } catch {
      // noop
    }
  }

  async getUserById(id: number): Promise<{
    id_usuario: number;
    usu_nom: string;
    ape_pat: string;
    ape_mat?: string;
  } | null> {
    if (!id || Number.isNaN(id)) {
      return null;
    }

    const internalSecret = process.env.INTERNAL_COMM_SECRET;
    if (!internalSecret) {
      this.logger.debug(
        'INTERNAL_COMM_SECRET no configurado. Se omite consulta TCP de usuario y se usa fallback local.',
      );
      return null;
    }

    try {
      const payload = { ids: [id], secret: internalSecret };
      const response = await firstValueFrom(
        this.client
          .send<FindUsersByIdsReply>('users.findByIds', payload)
          .pipe(rxTimeout(5000)),
      );

      if (!response || response.ok === false) {
        return null;
      }

      const first = response.data[0];
      if (!first?.id_usuario) {
        return null;
      }

      return {
        id_usuario: Number(first.id_usuario),
        usu_nom: String(first.nombres ?? '').trim(),
        ape_pat: String(first.ape_pat ?? '').trim(),
        ape_mat: String(first.ape_mat ?? '').trim() || undefined,
      };
    } catch (error: unknown) {
      this.logger.warn(
        `Error consultando usuario por TCP id=${id}: ${
          error instanceof Error ? error.message : 'error desconocido'
        }`,
      );
      return null;
    }
  }
}
