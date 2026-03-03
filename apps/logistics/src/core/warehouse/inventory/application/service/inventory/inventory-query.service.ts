/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConteoInventarioOrmEntity } from '../../../infrastructure/entity/inventory-count-orm.entity';
import { ListInventoryCountFilterDto } from '../../dto/in/list-inventory-count-filter.dto';
import { IInventoryRepositoryPort } from '../../../domain/ports/out/inventory-movement-ports-out';
import { StockResponseDto } from '../../dto/out/stock-response.dto';
import { InventoryMapper } from '../../mapper/inventory.mapper';
import { InventoryMovementResponseDto } from '../../dto/out/inventory-movement-response.dto';
import { firstValueFrom } from 'rxjs';
import { ClientProxy } from '@nestjs/microservices';

@Injectable()
export class InventoryQueryService {
  constructor(
    @Inject('IInventoryRepositoryPort')
    private readonly repository: IInventoryRepositoryPort,
    @InjectRepository(ConteoInventarioOrmEntity)
    private readonly conteoRepo: Repository<ConteoInventarioOrmEntity>,
    @Inject('ADMIN_SERVICE')
    private readonly adminClient: ClientProxy,
  ) {}

  async getStock(
    productId: number,
    warehouseId: number,
  ): Promise<StockResponseDto> {
    const stock = await this.repository.findStock(productId, warehouseId);

    if (!stock) {
      throw new NotFoundException(
        `No se encontró stock para el producto ${productId} en el almacén ${warehouseId}`,
      );
    }

    return InventoryMapper.toStockResponseDto(stock);
  }

  async obtenerConteoConDetalles(idConteo: number) {
    const data = await this.conteoRepo.findOne({
      where: { idConteo },
      relations: ['detalles'],
      order: {
        detalles: { idDetalle: 'ASC' },
      },
    });

    if (!data) {
      throw new Error(`No se encontró el conteo con ID ${idConteo}`);
    }

    return data;
  }

  async listarConteosPorSede(filtros: ListInventoryCountFilterDto) {
    const query = this.conteoRepo.createQueryBuilder('conteo');

    query.where('conteo.codSede = :idSede', { idSede: filtros.id_sede });

    if (filtros.fecha_inicio) {
      query.andWhere('DATE(conteo.fechaIni) >= :inicio', {
        inicio: filtros.fecha_inicio,
      });
    }

    if (filtros.fecha_fin) {
      query.andWhere('DATE(conteo.fechaIni) <= :fin', {
        fin: filtros.fecha_fin,
      });
    }

    query.orderBy('conteo.fechaIni', 'DESC');

    const data = await query.getMany();

    return { status: 200, data };
  }
  async getMovementsHistory(
    filters: any,
  ): Promise<{ data: InventoryMovementResponseDto[]; total: number }> {
    const [movements, total] = await this.repository.findAllMovements(filters);

    const sedeIds = new Set<number>();
    movements.forEach((mov) => {
      mov.details.forEach((det) => {
        const rawId =
          det.warehouseRelation?.sedeId ??
          (det.warehouseRelation as any)?.id_sede;
        if (rawId !== undefined && rawId !== null) {
          sedeIds.add(Number(rawId));
        }
      });
    });

    let sedeMap: Record<number, string> = {};
    if (sedeIds.size > 0) {
      try {
        sedeMap = await firstValueFrom(
          this.adminClient.send('get_sedes_nombres', Array.from(sedeIds)),
        );
      } catch (error) {
        console.error('TCP Error al obtener sedes:', error.message);
      }
    }

    const mappedData: InventoryMovementResponseDto[] = movements.map((mov) => {
      const detalleSalida = mov.details.find((d) => d.type === 'SALIDA');
      const detalleIngreso = mov.details.find((d) => d.type === 'INGRESO');

      const whSalidaNombre =
        detalleSalida?.warehouseRelation?.nombre ||
        (detalleSalida?.warehouseRelation as any)?.descripcion;
      const whIngresoNombre =
        detalleIngreso?.warehouseRelation?.nombre ||
        (detalleIngreso?.warehouseRelation as any)?.descripcion;

      let origenNombre = 'N/A';
      let destinoNombre = 'N/A';

      switch (mov.originType) {
        case 'TRANSFERENCIA':
          origenNombre = whSalidaNombre || 'Desconocido';
          destinoNombre = whIngresoNombre || 'En Tránsito';
          break;
        case 'COMPRA':
          origenNombre = 'Proveedor (Externo)';
          destinoNombre = whIngresoNombre || 'N/A';
          break;
        case 'VENTA':
          origenNombre = whSalidaNombre || 'N/A';
          destinoNombre = 'Cliente (Externo)';
          break;
        case 'AJUSTE':
          origenNombre = whSalidaNombre ? whSalidaNombre : 'Ajuste Manual';
          destinoNombre = whIngresoNombre ? whIngresoNombre : 'Ajuste Manual';
          break;
      }

      const idSedeInvolucrada =
        detalleSalida?.warehouseRelation?.sedeId ??
        (detalleSalida?.warehouseRelation as any)?.id_sede ??
        detalleIngreso?.warehouseRelation?.sedeId ??
        (detalleIngreso?.warehouseRelation as any)?.id_sede;

      const sedeNombre =
        idSedeInvolucrada !== undefined && idSedeInvolucrada !== null
          ? sedeMap[idSedeInvolucrada] ||
            sedeMap[idSedeInvolucrada.toString()] ||
            'Sede No Encontrada'
          : 'Sin Sede';

      const detallesUnicos = [];
      const mapProductos = new Map();

      mov.details.forEach((det) => {
        const idDelProducto = det.productRelation?.id_producto || det.productId;

        if (idDelProducto && !mapProductos.has(idDelProducto)) {
          mapProductos.set(idDelProducto, true);

          detallesUnicos.push({
            id: det.id,
            productoId: idDelProducto,
            codigo:
              det.productRelation?.codigo ||
              (det.productRelation ? 'S/C' : 'ERR_REL'),
            productoNombre:
              det.productRelation?.descripcion ||
              det.productRelation?.codigo ||
              `ID: ${idDelProducto}`,
            cantidad: det.quantity,
            unidadMedida: det.productRelation?.uni_med || 'UND',
            tipoOperacionItem: det.type,
          });
        }
      });

      return {
        id: mov.id,
        tipoMovimiento: mov.originType,
        fechaMovimiento: mov.date,
        motivo: mov.observation || 'Sin observación',
        documentoReferencia: mov.refTable
          ? `${mov.refTable} #${mov.refId}`
          : 'N/A',
        usuario: 'Sistema',
        almacenOrigenNombre: origenNombre,
        almacenDestinoNombre: destinoNombre,
        sedeNombre: sedeNombre,
        detalles: detallesUnicos,
      };
    });

    return { data: mappedData, total };
  }
}
