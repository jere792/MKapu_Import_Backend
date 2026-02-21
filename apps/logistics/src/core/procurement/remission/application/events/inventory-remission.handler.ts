/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Injectable, Inject } from '@nestjs/common';
import { RemissionCreatedEvent } from '../../domain/events/remission-created.event';
import { InventoryFacadePort } from '../../domain/ports/out/facade/inventory-facade.port';
import { OnEvent } from '@nestjs/event-emitter';

@Injectable()
export class InventoryRemissionHandler {
  constructor(
    @Inject('InventoryFacadePort')
    private readonly inventoryFacade: InventoryFacadePort,
  ) {}

  @OnEvent('RemissionCreatedEvent', { async: true })
  async handleStockDeduction(event: RemissionCreatedEvent) {
    try {
      await this.inventoryFacade.deductStockForRemission(event.payload);
      console.log(
        `[Inventario] Stock descontado por guía ${event.payload.serie_numero}`,
      );
    } catch (error) {
      console.error(
        `[ALERTA INVENTARIO] Falló el descuento de stock para la guía ${event.payload.serie_numero}`,
        error,
      );
    }
  }
}
