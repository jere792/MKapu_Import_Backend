import { Injectable, Inject, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, timeout as rxTimeout, catchError, retry, of } from 'rxjs';

type FindUsersByIdsReply =
  | { ok: true; data: Array<{ id_usuario: number; nombres: string; ape_pat?: string; ape_mat?: string; nombreCompleto?: string }> }
  | { ok: false; message?: string; data?: null };

@Injectable()
export class UsuarioTcpProxy implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(UsuarioTcpProxy.name);
  private isServiceHealthy = true;
  private lastHealthCheck = Date.now();
  private readonly HEALTH_CHECK_INTERVAL = 30000; // 30 segundos

  constructor(
    @Inject('USERS_SERVICE') 
    private readonly client: ClientProxy,
  ) {}

  async onModuleInit() {
    try {
      // Intentar conectar al iniciar el módulo
      await this.client.connect();
      this.logger.log('✅ Conexión establecida con USERS_SERVICE');
    } catch (error: any) {
      this.logger.warn(`⚠️ No se pudo conectar con USERS_SERVICE al inicio: ${error?.message}`);
      this.isServiceHealthy = false;
    }
  }

  async onModuleDestroy() {
    try {
      await this.client.close();
      this.logger.log('🔌 Conexión cerrada con USERS_SERVICE');
    } catch (error) {
      // Ignorar errores al cerrar
    }
  }

  /**
   * Verifica si es momento de hacer un health check
   */
  private shouldCheckHealth(): boolean {
    const now = Date.now();
    if (!this.isServiceHealthy && (now - this.lastHealthCheck) > this.HEALTH_CHECK_INTERVAL) {
      this.lastHealthCheck = now;
      return true;
    }
    return this.isServiceHealthy;
  }

  /**
   * Marca el servicio como no saludable temporalmente
   */
  private markUnhealthy() {
    this.isServiceHealthy = false;
    this.lastHealthCheck = Date.now();
    this.logger.warn('⚠️ USERS_SERVICE marcado como no disponible. Se reintentará en 30 segundos.');
  }

  /**
   * Marca el servicio como saludable
   */
  private markHealthy() {
    if (!this.isServiceHealthy) {
      this.logger.log('✅ USERS_SERVICE está disponible nuevamente');
    }
    this.isServiceHealthy = true;
    this.lastHealthCheck = Date.now();
  }

  async getUsersByIds(ids: number[]): Promise<Array<{ id_usuario: number; nombreCompleto: string }>> {
    if (!ids || ids.length === 0) return [];

    // Circuit breaker: si el servicio está marcado como no saludable, no intentar
    if (!this.shouldCheckHealth()) {
      this.logger.debug(`⏭️ Saltando llamada a USERS_SERVICE (servicio no disponible)`);
      return [];
    }

    try {
      this.logger.log(`📡 Solicitando usuarios [${ids.join(', ')}] al USERS_SERVICE`);

      const payload = { ids, secret: process.env.INTERNAL_COMM_SECRET };
      
      const response = await firstValueFrom(
        this.client
          .send<FindUsersByIdsReply>('users.findByIds', payload)
          .pipe(
            rxTimeout(5000), // Timeout de 5 segundos
            retry({
              count: 2, // Reintentar 2 veces
              delay: 1000, // Esperar 1 segundo entre reintentos
            }),
            catchError((error) => {
              this.logger.error(`❌ Error en llamada TCP: ${error?.message ?? error}`);
              return of(null); // Retornar null en caso de error
            })
          ),
      );

      // Si la respuesta es null (por el catchError)
      if (response === null) {
        this.markUnhealthy();
        return [];
      }

      // Si la respuesta no es exitosa
      if (!response || (response as any).ok === false) {
        const message = (response as any)?.message ?? 'respuesta vacía';
        this.logger.warn(`⚠️ USERS_SERVICE devolvió ok=false: ${message}`);
        this.markUnhealthy();
        return [];
      }

      // Éxito: marcar servicio como saludable
      this.markHealthy();

      const users = (response as any).data || [];
      const mapped = users.map((u: any) => ({
        id_usuario: Number(u.id_usuario),
        nombreCompleto: u.nombreCompleto ?? `${u.nombres ?? ''} ${u.ape_pat ?? ''} ${u.ape_mat ?? ''}`.trim(),
      }));
      
      this.logger.log(`✅ ${mapped.length} usuario(s) recibido(s)`);
      return mapped;

    } catch (error: any) {
      // Este catch solo debería ejecutarse en casos excepcionales
      this.logger.error(`❌ Error inesperado al consultar USERS_SERVICE: ${error?.message ?? error}`);
      this.markUnhealthy();
      return [];
    }
  }

  /**
   * Obtener un solo usuario por id
   */
  async getUserById(id: number): Promise<{ id_usuario: number; nombreCompleto: string } | null> {
    const users = await this.getUsersByIds([id]);
    return users.length ? users[0] : null;
  }

  /**
   * Método público para verificar el estado del servicio
   */
  isAvailable(): boolean {
    return this.isServiceHealthy;
  }
}