/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Inject } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { IInventoryCountCommandPort } from '../../../domain/ports/in/inventory-count-ports-in';
import { IInventoryCountRepository } from '../../../domain/ports/out/inventory-count-port-out';
import { IInventoryMovementCommandPort } from '../../../domain/ports/in/inventory-movement-ports-in.'; // <-- Importante
import { ConteoInventarioDetalleOrmEntity } from '../../../infrastructure/entity/inventory-count-detail-orm.entity';
import {
  ConteoEstado,
  ConteoInventarioOrmEntity,
} from '../../../infrastructure/entity/inventory-count-orm.entity';
import { StockOrmEntity } from '../../../infrastructure/entity/stock-orm-entity';
import {
  IniciarConteoDto,
  FinalizarConteoDto,
  ActualizarDetalleConteoDto,
} from '../../dto/in/inventory-count-dto-in';
import {
  InventoryCountDetailDomainEntity,
  InventoryCountDomainEntity,
} from '../../../domain/entity/inventory-count-domain-entity';

export class InventoryCountCommandService implements IInventoryCountCommandPort {
  constructor(
    private readonly dataSource: DataSource,
    @Inject('IInventoryCountRepository')
    private readonly countRepository: IInventoryCountRepository,
    @Inject('IInventoryMovementCommandPort')
    private readonly movementCommandPort: IInventoryMovementCommandPort,
  ) {}

  async initInventoryCount(dto: IniciarConteoDto) {
    return await this.dataSource.transaction(async (manager) => {
      const whereClause: any = { id_sede: String(dto.idSede) };
      if (dto.idCategoria) {
        whereClause.producto = { categoria: dto.idCategoria };
      }
      const stocksSede = await manager.find(StockOrmEntity, {
        where: whereClause,
        relations: ['producto'],
      });

      if (!stocksSede || stocksSede.length === 0) {
        throw new Error('No hay stock registrado en esta sede.');
      }

      const nuevoConteo = manager.create(ConteoInventarioOrmEntity, {
        codSede: String(dto.idSede),
        nomSede: dto.nomSede,
        usuarioCreacionRef: dto.idUsuario,
        estado: ConteoEstado.PENDIENTE,
        totalItems: stocksSede.length,
        totalDiferencias: 0,
        idCategoria: dto.idCategoria || null,
        nomCategoria: dto.nomCategoria || null,
      });
      const conteoGuardado = await manager.save(nuevoConteo);

      const detalles = stocksSede.map((s) => {
        return manager.create(ConteoInventarioDetalleOrmEntity, {
          conteo: conteoGuardado,
          idProducto: s.id_producto,
          codProd: s.producto.codigo,
          descripcion: s.producto.descripcion,
          uniMed:
            (s.producto as any).uniMed || (s.producto as any).uni_med || 'UND',
          idStock: s.id_stock,
          idAlmacen: s.id_almacen,
          idSedeRef: Number(s.id_sede),
          stockSistema: Number(s.cantidad),
          stockConteo: null,
          diferencia: 0,
          estado: 1,
        });
      });
      await manager.save(detalles);
      return { idConteo: conteoGuardado.idConteo };
    });
  }

  async endInventoryCount(idConteo: number, dto: FinalizarConteoDto) {
    let ajustesParaMovimientos = [];

    await this.dataSource.transaction(async (manager) => {
      const conteoOrm = await manager.findOne(ConteoInventarioOrmEntity, {
        where: { idConteo },
        relations: ['detalles'],
      });
      if (!conteoOrm) throw new Error('El conteo no existe');

      const detallesDomain = conteoOrm.detalles.map(
        (d) =>
          new InventoryCountDetailDomainEntity(
            d.idDetalle,
            d.idProducto,
            d.idStock,
            d.idAlmacen,
            d.idSedeRef,
            Number(d.stockSistema),
            d.stockConteo ? Number(d.stockConteo) : null,
            Number(d.diferencia),
            d.estado,
          ),
      );

      const conteoDomain = new InventoryCountDomainEntity(
        conteoOrm.idConteo,
        conteoOrm.codSede,
        conteoOrm.nomSede,
        conteoOrm.usuarioCreacionRef,
        conteoOrm.estado as ConteoEstado,
        conteoOrm.totalItems,
        conteoOrm.totalDiferencias,
        conteoOrm.fechaIni,
        conteoOrm.fechaFin,
        detallesDomain,
      );

      if (dto.estado === ConteoEstado.AJUSTADO) {
        ajustesParaMovimientos = conteoDomain.finalizarAjuste(dto.data);

        ajustesParaMovimientos = ajustesParaMovimientos.map((ajuste) => {
          const idBuscado = ajuste.productId || ajuste.idProducto;
          const detalleOrm = conteoOrm.detalles.find(
            (d) => d.idProducto === idBuscado,
          );

          const almacenReal = detalleOrm
            ? detalleOrm.idAlmacen
            : dto.data[0]?.warehouseId || Number(conteoOrm.codSede);

          return {
            ...ajuste,
            warehouseId: almacenReal,
          };
        });
      } else {
        conteoDomain.anularConteo();
      }

      for (const detDomain of conteoDomain.detalles) {
        if (detDomain.estado === 2) {
          await manager.update(
            ConteoInventarioDetalleOrmEntity,
            detDomain.idDetalle,
            {
              stockConteo: detDomain.stockConteo,
              diferencia: detDomain.diferencia,
              estado: detDomain.estado,
            },
          );

          await manager.update(StockOrmEntity, detDomain.idStock, {
            cantidad: detDomain.stockConteo,
          });
        }
      }

      await manager.update(ConteoInventarioOrmEntity, idConteo, {
        estado: conteoDomain.estado,
        fechaFin: conteoDomain.fechaFin,
      });
    });

    if (ajustesParaMovimientos.length > 0) {
      console.log(
        'ENVIANDO AJUSTES AL MODULE DE MOVIMIENTOS:',
        JSON.stringify(ajustesParaMovimientos, null, 2),
      );
      await this.movementCommandPort.applyInventoryAdjustments({
        refId: idConteo,
        refTable: 'conteo_inventario',
        adjustments: ajustesParaMovimientos,
      });
    }

    return { success: true, message: 'Conteo finalizado exitosamente' };
  }

  async registerPhysicCount(
    idDetalle: number,
    dto: ActualizarDetalleConteoDto,
  ) {
    const repo = this.dataSource.getRepository(
      ConteoInventarioDetalleOrmEntity,
    );
    const detalleOrm = await repo.findOneBy({ idDetalle });

    if (!detalleOrm) throw new Error('Detalle no encontrado');

    const detalleDomain = new InventoryCountDetailDomainEntity(
      detalleOrm.idDetalle,
      detalleOrm.idProducto,
      detalleOrm.idStock,
      detalleOrm.idAlmacen,
      detalleOrm.idSedeRef,
      Number(detalleOrm.stockSistema),
      detalleOrm.stockConteo !== null ? Number(detalleOrm.stockConteo) : null,
      Number(detalleOrm.diferencia),
      detalleOrm.estado,
    );

    detalleDomain.registrarConteoFisico(Number(dto.stockConteo));

    detalleOrm.stockConteo = detalleDomain.stockConteo;
    detalleOrm.diferencia = detalleDomain.diferencia;
    detalleOrm.estado = detalleDomain.estado;
    detalleOrm.observacion = dto.observacion;

    return await repo.save(detalleOrm);
  }
}
