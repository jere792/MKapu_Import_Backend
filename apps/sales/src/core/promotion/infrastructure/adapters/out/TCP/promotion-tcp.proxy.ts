/* sales/src/core/sales-receipt/infrastructure/adapters/out/TCP/promotion-tcp.proxy.ts */

import { Injectable, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, timeout, catchError, of } from 'rxjs';

export interface PromotionRuleDto {
  idRegla: number;
  tipoCondicion: string;
  valorCondicion: string;
}

export interface PromotionDto {
  idPromocion: number;
  concepto: string;
  tipo: string;       // 'PORCENTAJE' | 'MONTO_FIJO'
  valor: number;
  activo: boolean;
  reglas: PromotionRuleDto[];
}

@Injectable()
export class PromotionTcpProxy {
  constructor(
    // El token debe coincidir con el nombre registrado en sales.module.ts
    // Ejemplo: ClientsModule.register([{ name: 'PROMOTION_SERVICE', ... }])
    @Inject('PROMOTION_SERVICE')
    private readonly client: ClientProxy,
  ) {}

  /**
   * Obtiene una promoción activa por ID, incluyendo sus reglas.
   * Retorna null si no existe o si el microservicio no responde.
   */
  async getPromotionById(id: number): Promise<PromotionDto | null> {
    return firstValueFrom(
      this.client
        .send<PromotionDto | null>({ cmd: 'get_promotion_by_id' }, { id })
        .pipe(
          timeout(5000),
          catchError((err) => {
            console.error(
              `[PromotionTcpProxy] Error al obtener promoción ${id}:`,
              err?.message ?? err,
            );
            return of(null);
          }),
        ),
    );
  }

  /**
   * Obtiene todas las promociones activas.
   * Retorna [] si el microservicio no responde.
   */
  async getActivePromotions(): Promise<PromotionDto[]> {
    return firstValueFrom(
      this.client
        .send<PromotionDto[]>({ cmd: 'get_active_promotions' }, {})
        .pipe(
          timeout(5000),
          catchError((err) => {
            console.error(
              `[PromotionTcpProxy] Error al obtener promociones activas:`,
              err?.message ?? err,
            );
            return of([]);
          }),
        ),
    );
  }
}