import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { CreateSaleDto } from './core/dto/create-sale.dto';
import { HttpService } from '@nestjs/axios';


@Injectable()
export class SalesService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly http: HttpService,
  ) {}

  async createSale(dto: CreateSaleDto) {
    return this.dataSource.transaction(async (manager) => {
      const saleResult = await manager.query(
        `INSERT INTO venta(fecha, cliente_id) VALUES (NOW(), ?)`,
        [dto.customerId],
      );
      const saleId = saleResult.insertId;

      for (const item of dto.items) {
        // 2.1 Guardar detalle
        await manager.query(
          `INSERT INTO venta_detalle(venta_id, producto_id, cantidad, precio)
           VALUES (?, ?, ?, ?)`,
          [saleId, item.productId, item.quantity, item.price],
        );

        // 2.2 🔴 DESCONTAR STOCK (HTTP)
        await this.http.axiosRef.post(
          'http://localhost:3001/stock/movement',
          {
            productId: item.productId,
            warehouseId: item.warehouseId,
            headquartersId: item.headquartersId,
            quantityDelta: -item.quantity,
            reason: 'VENTA',
            referenceId: saleId,
          },
        );
      }
      return { ok: true, saleId };
    });
  }
}
