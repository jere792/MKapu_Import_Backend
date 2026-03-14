import { Controller, Logger } from "@nestjs/common";
import { MessagePattern, Payload } from "@nestjs/microservices";
import { ok } from "assert";
import { DataSource } from "typeorm";

@Controller()
export class StockTcpController {
    private readonly logger = new Logger(StockTcpController.name);

    constructor(private readonly dataSource: DataSource) { }

    @MessagePattern({ cmd: 'increase_stock' })
    async increaseStock(@Payload() data: { productId: number; quantity: number; refId: number; headquarterId: number }) {
        this.logger.log(`[TCP] increase_stock - productId: ${ data.productId }, quantity: ${ data.quantity }`);

        const queryRunner = this.dataSource.createQueryRunner();

        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const movResult = await queryRunner.manager.query(
                `INSERT INTO movimiento_inventario (tipo_origen, ref_id, ref_tabla, observacion)
                 VALUES ('VENTA', ?, 'nota_credito', 'Devolucion por nota de credito')`,
                [data.refId]
            );

            const idMovimiento = movResult.insertId;
            
            await queryRunner.manager.query(
                `INSERT INTO detalle_movimiento_inventario (id_movimiento, id_producto, id_almacen, cantidad, tipo)
                 VALUES (?, ?, ?, ?, 'INGRESO')`,
                [idMovimiento, data.productId, data.headquarterId, data.quantity]
            );

            await queryRunner.manager.query(
                `UPDATE stock SET cantidad = cantidad + ?
                 WHERE id_producto = ? AND id_almacen = ?`,
                [data.quantity, data.productId, data.headquarterId]
            );

            await queryRunner.commitTransaction();

            return {
                ok: true,
                message: `Stock incrementado para producto ${ data.productId }.`
            }
        } catch (error) {
            await queryRunner.rollbackTransaction();
            this.logger.error(`Error en increase_stock: ${ error.message }.`);

            return {
                ok: false,
                message: error.message
            };
        } finally {
            await queryRunner.release();
        }
    }
}