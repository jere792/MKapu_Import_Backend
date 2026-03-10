import {
  Inject,
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, timeout } from 'rxjs';
import {
  IWarehouseGatewayPort,
  WarehouseInfo,
} from '../../../../domain/ports/out/sede-almacen-ports-out';

type FindWarehousesByIdsReply =
  | { ok: true; data: WarehouseInfo[] }
  | { ok: false; message?: string; data?: null };

const MAX_IDS = 100;
const TCP_TIMEOUT_MS = 5_000;
const RETRY_DELAY_MS = 3_000;
const MAX_RETRIES = 5;

@Injectable()
export class AlmacenTcpProxy
  implements IWarehouseGatewayPort, OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(AlmacenTcpProxy.name);
  private connected = false;

  constructor(
    @Inject('ALMACEN_SERVICE')
    private readonly client: ClientProxy,
  ) {}

  async onModuleInit(): Promise<void> {
    this.connectWithRetry();
  }

  async onModuleDestroy(): Promise<void> {
    try {
      await this.client.close();
    } catch {
    }
  }

  private async connectWithRetry(attempt = 1): Promise<void> {
    try {
      await this.client.connect();
      this.connected = true;
      this.logger.log('✅ Conexión establecida con ALMACEN_SERVICE');
    } catch (error: any) {
      this.connected = false;

      if (attempt >= MAX_RETRIES) {
        this.logger.error(
          `ALMACEN_SERVICE no disponible tras ${MAX_RETRIES} intentos. ` +
            `Las consultas de almacén retornarán vacío hasta que el servicio esté activo.`,
        );
        return;
      }

      this.logger.warn(
        `Intento ${attempt}/${MAX_RETRIES} fallido conectando a ALMACEN_SERVICE ` +
          `(reintentando en ${RETRY_DELAY_MS / 1000}s): ${error?.message ?? error}`,
      );

      await this.delay(RETRY_DELAY_MS);
      await this.connectWithRetry(attempt + 1);
    }
  }


  async getWarehouseById(id_almacen: number): Promise<WarehouseInfo | null> {
    if (!id_almacen || Number.isNaN(id_almacen)) return null;
    const list = await this.getWarehousesByIds([id_almacen]);
    return list[0] ?? null;
  }

  async getWarehousesByIds(ids: number[]): Promise<WarehouseInfo[]> {
    const normalized = Array.from(
      new Set(ids.map(Number).filter((id) => id > 0)),
    );
    if (normalized.length === 0) return [];

    if (normalized.length > MAX_IDS) {
      this.logger.warn(
        `Solicitud excede límite de ${MAX_IDS} almacenes. Recibidos: ${normalized.length}`,
      );
      return [];
    }

    if (!this.connected) {
      await this.tryReconnect();
      if (!this.connected) {
        this.logger.warn('ALMACEN_SERVICE no disponible, retornando vacío.');
        return [];
      }
    }

    try {
      const payload = {
        ids: normalized,
        secret: process.env.INTERNAL_COMM_SECRET,
      };

      const response = await firstValueFrom(
        this.client
          .send<FindWarehousesByIdsReply>('almacenes.findByIds', payload)
          .pipe(timeout(TCP_TIMEOUT_MS)),
      );

      if (!response || response.ok === false) return [];

      return response.data ?? [];
    } catch (error: any) {
      this.connected = false;
      this.logger.warn(
        `Error consultando almacenes por TCP: ${error?.message ?? error}`,
      );
      return [];
    }
  }

  // ─── Helpers privados ─────────────────────────────────────────────────────────

  private async tryReconnect(): Promise<void> {
    try {
      await this.client.connect();
      this.connected = true;
      this.logger.log('✅ Reconectado a ALMACEN_SERVICE');
    } catch {
      this.connected = false;
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}