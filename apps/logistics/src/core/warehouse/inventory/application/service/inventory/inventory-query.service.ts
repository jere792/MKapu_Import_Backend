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
import { AdminTcpProxy } from '../../../infrastructure/adapters/out/TCP/admin-tcp.proxy';
import { IInventoryCountRepository } from '../../../domain/ports/out/inventory-count-port-out';

@Injectable()
export class InventoryQueryService {
  constructor(
    @Inject('IInventoryRepositoryPort')
    private readonly repository: IInventoryRepositoryPort,
    @InjectRepository(ConteoInventarioOrmEntity)
    private readonly conteoRepo: Repository<ConteoInventarioOrmEntity>,
    private readonly adminTcpProxy: AdminTcpProxy,
    @Inject('IInventoryCountRepository')
    private readonly inventoryCountRepository: IInventoryCountRepository,
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
    const sedeParam = filtros.id_sede ? filtros.id_sede.toString() : undefined;
    const data =
      await this.inventoryCountRepository.listAllHeadersBySede(sedeParam);

    return { status: 200, data };
  }

  async getMovementsHistory(
    filters: any,
  ): Promise<{ data: InventoryMovementResponseDto[]; total: number }> {
    const page = Number(filters.page ?? 1);
    const limit = Number(filters.limit ?? 10);

    const [movements, total] = await this.repository.findAllMovements({
      ...filters,
      page,
      limit,
    });

    const sedeIds = new Set<number>();
    movements.forEach((mov) => {
      mov.details.forEach((det: { warehouseRelation: { sedeId: any } }) => {
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
      const result = await this.adminTcpProxy.getHeadquartersNames(
        Array.from(sedeIds),
      );
      if (result) {
        sedeMap = result;
      }
    }

    const labelMap: Record<string, string> = {
      conteo_inventario: 'Conteo de Inventario',
      venta: 'Venta',
      compra: 'Compra',
      transferencia: 'Transferencia',
      ajuste_manual: 'Ajuste Manual',
      guia_remision: 'Guía de Remisión',
      orden_compra: 'Orden de Compra',
      venta_tcp: 'Comprobante de Venta',
      compra_tcp: 'Ingreso por Compra',
      remision_tcp: 'Guía de Remisión (Externa)',
    };

    const mappedData: InventoryMovementResponseDto[] = movements.map((mov) => {
      const detalleConAlmacen = mov.details.find(
        (d: { warehouseRelation: null }) => d.warehouseRelation != null,
      );

      const warehouseName =
        detalleConAlmacen?.warehouseRelation?.nombre ||
        (detalleConAlmacen?.warehouseRelation as any)?.descripcion ||
        'Almacén Desconocido';

      let origenNombre = 'N/A';
      let destinoNombre = 'N/A';

      const originType = mov.originType?.toUpperCase();

      switch (originType) {
        case 'TRANSFERENCIA': {
          const dSalida = mov.details.find(
            (d: { type: string }) => d.type === 'SALIDA',
          );
          const dIngreso = mov.details.find(
            (d: { type: string }) => d.type === 'INGRESO',
          );
          origenNombre = dSalida?.warehouseRelation?.nombre || 'Desconocido';
          destinoNombre = dIngreso?.warehouseRelation?.nombre || 'En Tránsito';
          break;
        }
        case 'COMPRA':
          origenNombre = 'Proveedor (Externo)';
          destinoNombre = warehouseName;
          break;
        case 'VENTA':
          origenNombre = warehouseName;
          destinoNombre = 'Cliente (Externo)';
          break;
        case 'AJUSTE':
        case 'CONTEO':
        case 'INVENTARIO': {
          const isSalida = mov.details.some(
            (d: { type: string }) => d.type === 'SALIDA',
          );
          const isIngreso = mov.details.some(
            (d: { type: string }) => d.type === 'INGRESO',
          );

          if (isSalida && isIngreso) {
            origenNombre = warehouseName;
            destinoNombre = warehouseName;
          } else if (isSalida) {
            origenNombre = warehouseName;
            destinoNombre = 'Ajuste Manual (Merma/Faltante)';
          } else if (isIngreso) {
            origenNombre = 'Ajuste Manual (Sobrante)';
            destinoNombre = warehouseName;
          } else {
            origenNombre = 'Ajuste Manual';
            destinoNombre = 'Ajuste Manual';
          }
          break;
        }
        default:
          origenNombre = warehouseName;
          destinoNombre = warehouseName;
          break;
      }

      const idSedeInvolucrada =
        detalleConAlmacen?.warehouseRelation?.sedeId ??
        (detalleConAlmacen?.warehouseRelation as any)?.id_sede;

      const sedeNombre =
        idSedeInvolucrada !== undefined && idSedeInvolucrada !== null
          ? sedeMap[idSedeInvolucrada] ||
            sedeMap[idSedeInvolucrada.toString()] ||
            'Sede No Encontrada'
          : 'Sin Sede';

      const detallesUnicos = [];
      const mapProductos = new Map();

      mov.details.forEach(
        (det: {
          productRelation: {
            id_producto: any;
            codigo: any;
            descripcion: any;
            uni_med: any;
          };
          productId: any;
          id: any;
          quantity: any;
          type: any;
        }) => {
          const idDelProducto =
            det.productRelation?.id_producto || det.productId;

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
        },
      );

      const rawTableName = mov.refTable?.toLowerCase().trim() || '';
      const friendlyTableLabel =
        labelMap[rawTableName] || mov.refTable || 'Documento';

      let docReferenciaFormateado = 'N/A';
      if (mov.refTable) {
        docReferenciaFormateado = `${friendlyTableLabel} #${mov.refId}`;

        if (rawTableName.includes('tcp') && mov.observation) {
          docReferenciaFormateado += ` (${mov.observation})`;
        }
      }

      return {
        id: mov.id,
        tipoMovimiento: mov.originType,
        fechaMovimiento: mov.date,
        motivo: mov.observation || 'Sin observación',
        documentoReferencia: docReferenciaFormateado,
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
