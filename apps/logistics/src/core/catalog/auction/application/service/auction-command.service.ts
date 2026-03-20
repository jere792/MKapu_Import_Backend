import { Injectable, Inject, BadRequestException, Logger, InternalServerErrorException } from '@nestjs/common';
import { IAuctionCommandPort } from '../../domain/port/in/auction.port.in';
import { IAuctionRepositoryPort } from '../../domain/port/out/auction.port.out';
import { CreateAuctionDto } from '../dto/in/create-auction.dto';
import { Auction, AuctionStatus } from '../../domain/entity/auction-domain-entity';
import { AuctionMapper } from '../mapper/auction.mapper';
import { AuctionResponseDto } from '../dto/out/auction-response.dto';
import { InventoryCommandService } from '../../../../warehouse/inventory/application/service/inventory/inventory-command.service';
import { MovementRequest } from '../../../../warehouse/inventory/domain/ports/in/inventory-movement-ports-in.';

@Injectable()
export class AuctionCommandService implements IAuctionCommandPort {
  private readonly logger = new Logger(AuctionCommandService.name);

  constructor(
    @Inject('IAuctionRepositoryPort')
    private readonly repository: IAuctionRepositoryPort,
    private readonly inventoryService: InventoryCommandService,
  ) {}

  async create(dto: CreateAuctionDto): Promise<AuctionResponseDto> {
    if (!dto.detalles || dto.detalles.length === 0) {
      throw new BadRequestException('Se requiere al menos un detalle para crear la subasta.');
    }
    if (!dto.id_almacen_ref || dto.id_almacen_ref <= 0) {
      throw new BadRequestException('Se requiere id_almacen_ref válido para descontar stock.');
    }

    for (const item of dto.detalles) {
      const stockDisponible = await this.inventoryService.getStockLevel(
        item.id_producto,
        dto.id_almacen_ref,
      );
      if (!stockDisponible || stockDisponible < item.stock_remate) {
        throw new BadRequestException(
          `Stock insuficiente para el producto ID ${item.id_producto}. Disponible: ${stockDisponible || 0}, Requerido: ${item.stock_remate}`,
        );
      }
    }

    // ── Resuelve id_sede_ref desde el almacén ─────────────────────────────
    const id_sede_ref = await this.repository.resolveSedeByAlmacen(dto.id_almacen_ref);
    if (!id_sede_ref) {
      throw new BadRequestException(
        `No se encontró sede asociada al almacén ID ${dto.id_almacen_ref}.`,
      );
    }
    this.logger.log(`Sede resuelta para almacén ${dto.id_almacen_ref}: sede=${id_sede_ref}`);

    const shouldGenerateCode = !dto.cod_remate || dto.cod_remate.trim() === '';
    const temporaryCode = shouldGenerateCode ? 'TEMP-PENDING' : dto.cod_remate!;
    this.logger.log(`Creando remate con código: ${shouldGenerateCode ? 'AUTO-GENERADO' : temporaryCode}`);

    const domain = new Auction(
      temporaryCode,
      dto.descripcion,
      dto.estado as any,
      undefined,
      dto.detalles.map(d => ({
        productId:     d.id_producto,
        originalPrice: d.pre_original,
        auctionPrice:  d.pre_remate,
        auctionStock:  d.stock_remate,
        observacion:   d.observacion,
      })),
      dto.id_almacen_ref,  // warehouseRefId
      id_sede_ref,         // sedeRefId ← nuevo
    );

    let saved = await this.repository.save(domain);
    this.logger.log(`Remate guardado con ID: ${saved.id}`);

    let finalCode = dto.cod_remate;
    if (shouldGenerateCode) {
      const year = new Date().getFullYear();
      finalCode = `RMT-${year}-${String(saved.id ?? 0).padStart(3, '0')}`;
      this.logger.log(`Generando código automático: ${finalCode}`);
      try {
        saved.code = finalCode;
        saved = await this.repository.save(saved);
        this.logger.log(`Código actualizado a: ${finalCode}`);
      } catch (err) {
        this.logger.error('Error actualizando código', err);
        try { await this.repository.delete(saved.id!); } catch (e) { this.logger.error('Error en rollback', e); }
        throw new InternalServerErrorException('No se pudo generar el código del remate.');
      }
    }

    const exitPayload: MovementRequest = {
      originType:  'AJUSTE' as MovementRequest['originType'],
      refId:       saved.id!,
      refTable:    'remate',
      observation: `Remate registrado: ${finalCode}`,
      items: dto.detalles.map((d) => ({
        productId:   d.id_producto,
        warehouseId: dto.id_almacen_ref,
        sedeId:      id_sede_ref,  // ← ya no es 0
        quantity:    d.stock_remate,
      })),
    };

    try {
      await this.inventoryService.registerExit(exitPayload);
      this.logger.log(`Salida de inventario registrada para remate ${finalCode}`);
    } catch (err) {
      this.logger.error(`Error registrando salida en inventario para remate id=${saved.id}`, err);
      try { await this.repository.delete(saved.id!); } catch (delErr) { this.logger.error('Error compensando', delErr); }
      throw new InternalServerErrorException('Error al registrar salida en inventario. Operación revertida.');
    }

    const final = await this.repository.findById(saved.id!);
    this.logger.log(`Remate ${finalCode} creado exitosamente`);
    return AuctionMapper.toResponseDto(final);
  }
  
  async update(id: number, dto: any): Promise<AuctionResponseDto> {
    const existing = await this.repository.findById(id);
    if (!existing) throw new BadRequestException('Subasta no encontrada.');

    const domain = existing;
    if (dto.cod_remate  !== undefined) domain.code        = dto.cod_remate;
    if (dto.descripcion !== undefined) domain.description = dto.descripcion;
    if (dto.estado      !== undefined) domain.status      = dto.estado;

    if (dto.detalles && Array.isArray(dto.detalles) && dto.detalles.length > 0) {
      for (const dtoDetalle of dto.detalles) {
        const idx = domain.details.findIndex(d =>
          ((dtoDetalle.id_detalle_remate) && (d as any).id_detalle_remate === dtoDetalle.id_detalle_remate) ||
          ((dtoDetalle.id_producto)       && d.productId === dtoDetalle.id_producto)
        );
        if (idx !== -1) {
          domain.details[idx] = {
            ...domain.details[idx],
            auctionPrice:  dtoDetalle.pre_remate   ?? domain.details[idx].auctionPrice,
            auctionStock:  dtoDetalle.stock_remate ?? domain.details[idx].auctionStock,
            originalPrice: dtoDetalle.pre_original ?? domain.details[idx].originalPrice,
          };
        }
      }
    }

    const saved = await this.repository.save(domain);
    return AuctionMapper.toResponseDto(saved);
  }

  // ── Finalizar: el remate terminó, no hay más productos disponibles ────────
  async finalize(id: number): Promise<AuctionResponseDto> {
    const existing = await this.repository.findById(id);
    if (!existing) throw new BadRequestException('Subasta no encontrada.');

    if (existing.status === AuctionStatus.CANCELADO) {
      throw new BadRequestException('No se puede finalizar un remate cancelado.');
    }
    if (existing.status === AuctionStatus.FINALIZADO) {
      throw new BadRequestException('El remate ya está finalizado.');
    }

    existing.finalize();
    const saved = await this.repository.save(existing);
    return AuctionMapper.toResponseDto(saved);
  }

  // ── Cancelar: devuelve el stock al almacén ────────────────────────────────
  async cancel(id: number): Promise<AuctionResponseDto> {
    const existing = await this.repository.findById(id);
    if (!existing) throw new BadRequestException('Subasta no encontrada.');

    if (existing.status === AuctionStatus.CANCELADO) {
      throw new BadRequestException('El remate ya está cancelado.');
    }
    if (existing.status === AuctionStatus.FINALIZADO) {
      throw new BadRequestException('No se puede cancelar un remate ya finalizado.');
    }

    // Cancela en dominio
    existing.cancel();
    const saved = await this.repository.save(existing);

    // ── Devuelve el stock al almacén usando registerIncome ────────────────
    const almacenId = (existing as any).warehouseRefId ?? 0;

    if (almacenId > 0) {
      const entryPayload: MovementRequest = {
        originType:  'AJUSTE' as MovementRequest['originType'],
        refId:       saved.id!,
        refTable:    'remate',
        observation: `Cancelación de remate: ${saved.code} — stock devuelto`,
        items: existing.details.map(d => ({
          productId:   d.productId,
          warehouseId: almacenId,
          sedeId:      0,
          quantity:    d.auctionStock,
        })),
      };

      try {
        await this.inventoryService.registerIncome(entryPayload);
        this.logger.log(`Stock devuelto al almacén ${almacenId} por cancelación de remate ${saved.code}`);
      } catch (err) {
        // Si falla la devolución, revertir el estado a ACTIVO
        this.logger.error(`Error devolviendo stock en cancelación de remate id=${id}`, err);
        existing.status = AuctionStatus.ACTIVO;
        await this.repository.save(existing);
        throw new InternalServerErrorException(
          'No se pudo devolver el stock al almacén. El remate permanece ACTIVO.'
        );
      }
    } else {
      // Si no hay almacén referenciado, solo cancela sin mover stock
      this.logger.warn(`Remate ${saved.code} cancelado sin devolución de stock (almacén no identificado).`);
    }

    return AuctionMapper.toResponseDto(saved);
  }

  async delete(id: number): Promise<void> {
    await this.repository.delete(id);
  }
}