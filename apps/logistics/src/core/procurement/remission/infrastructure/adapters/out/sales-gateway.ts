/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { SalesGatewayPortOut } from '../../../domain/ports/out/sales-gateway-port-out';

export interface SaleValidatedDto {
  id: number;
  items: { codProd: string; quantity: number }[];
}

@Injectable()
export class SalesGateway implements SalesGatewayPortOut {
  constructor(
    @Inject('SALES_SERVICE') private readonly salesClient: ClientProxy,
  ) {}

  async getValidSaleForDispatch(saleId: number): Promise<SaleValidatedDto> {
    const saleResponse = await firstValueFrom(
      this.salesClient.send({ cmd: 'verify_sale' }, saleId),
    ).catch(() => null);

    if (!saleResponse || !saleResponse.success) {
      throw new NotFoundException('Venta no encontrada o inválida');
    }
    console.log('Respuesta cruda de Sales:', JSON.stringify(saleResponse.data));

    const rawDetails =
      saleResponse.data.details ||
      saleResponse.data.detalles ||
      saleResponse.data.items ||
      [];

    return {
      id: saleId,
      items: rawDetails.map((item: any) => ({
        codProd: item.cod_prod || item.codProd,
        quantity: Number(item.cantidad),
      })),
    };
  }

  async markAsDispatched(saleId: number): Promise<void> {
    await firstValueFrom(
      this.salesClient.send(
        { cmd: 'update_dispatch_status' },
        { id_venta: saleId, status: 'EN_CAMINO' },
      ),
    );
  }
  async findSaleByCorrelativo(correlativo: string): Promise<any> {
    try {
      const sale = await firstValueFrom(
        this.salesClient.send({ cmd: 'find_sale_by_correlativo' }, correlativo),
      );

      if (!sale) {
        throw new NotFoundException(
          `No se encontró la venta con correlativo ${correlativo}`,
        );
      }

      return sale;
    } catch (error) {
      throw new NotFoundException(
        'Venta no encontrada en el sistema de ventas',
      );
    }
  }
  async findSaleById(idVenta: string): Promise<any> {
    try {
      const saleData = await firstValueFrom(
        this.salesClient.send('get_sale_by_id', idVenta),
      );
      console.log(
        `[SalesGateway] Respuesta cruda recibida de Ventas:`,
        JSON.stringify(saleData, null, 2),
      );

      if (!saleData) {
        throw new NotFoundException(
          `La venta con ID ${idVenta} no fue encontrada en el microservicio.`,
        );
      }

      return saleData;
    } catch (error) {
      console.error(
        `Error al obtener la venta ${idVenta} desde SalesGateway:`,
        error,
      );
      throw new Error(
        `No se pudo conectar con el servicio de ventas para el ID ${idVenta}`,
      );
    }
  }
}
