/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Injectable, Inject } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { RemissionCreatedEvent } from '../../domain/events/remission-created.event';
import { SalesGatewayPortOut } from '../../domain/ports/out/sales-gateway-port-out';

@Injectable()
export class SalesRemissionHandler {
  constructor(
    @Inject('SalesGatewayPort')
    private readonly salesGateway: SalesGatewayPortOut,
  ) {}

  @OnEvent('RemissionCreatedEvent', { async: true })
  async handleSalesStatus(event: RemissionCreatedEvent) {
    try {
      await this.salesGateway.markAsDispatched(event.payload.refId);
      console.log(
        `[Ventas] Venta ${event.payload.refId} marcada como despachada`,
      );
    } catch (error) {
      console.error(
        `[ALERTA VENTAS] No se pudo cambiar el estado de la venta ${event.payload.refId}`,
        error,
      );
    }
  }
}
