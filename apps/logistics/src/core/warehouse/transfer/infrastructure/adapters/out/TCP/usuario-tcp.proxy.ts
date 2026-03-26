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

type TransferTcpUserLookup = {
  id_usuario: number;
  usu_nom: string;
  ape_pat: string;
  ape_mat?: string;
};

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

  async getUserById(id: number): Promise<TransferTcpUserLookup | null> {
    const users = await this.getUsersByIds([id]);
    return users[0] ?? null;
  }

  async getUsersByIds(ids: number[]): Promise<TransferTcpUserLookup[]> {
    const normalizedIds = Array.from(
      new Set(
        (ids ?? [])
          .map((value) => Number(value))
          .filter((value) => Number.isInteger(value) && value > 0),
      ),
    );

    if (normalizedIds.length === 0) {
      return [];
    }

    const internalSecret = process.env.INTERNAL_COMM_SECRET;
    if (!internalSecret) {
      this.logger.debug(
        'INTERNAL_COMM_SECRET no configurado. Se omite consulta TCP de usuarios y se usa fallback local.',
      );
      return [];
    }

    try {
      const response = await firstValueFrom(
        this.client
          .send<FindUsersByIdsReply>('users.findByIds', {
            ids: normalizedIds,
            secret: internalSecret,
          })
          .pipe(rxTimeout(5000)),
      );

      if (!response || response.ok === false || !Array.isArray(response.data)) {
        return [];
      }

      const users: TransferTcpUserLookup[] = [];

      for (const user of response.data) {
        const userId = Number(user.id_usuario);
        if (!Number.isInteger(userId) || userId <= 0) {
          continue;
        }

        const middleName = String(user.ape_mat ?? '').trim();
        users.push({
          id_usuario: userId,
          usu_nom: String(user.nombres ?? '').trim(),
          ape_pat: String(user.ape_pat ?? '').trim(),
          ape_mat: middleName || undefined,
        });
      }

      return users;
    } catch (error: unknown) {
      this.logger.warn(
        `Error consultando usuarios por TCP: ${
          error instanceof Error ? error.message : 'error desconocido'
        }`,
      );
      return [];
    }
  }
}
