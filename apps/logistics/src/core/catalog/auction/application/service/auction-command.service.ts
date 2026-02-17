import { Injectable, Inject, BadRequestException, Logger, InternalServerErrorException } from '@nestjs/common';
import { IAuctionCommandPort } from '../../domain/port/in/auction.port.in';
import { IAuctionRepositoryPort } from '../../domain/port/out/auction.port.out';
import { CreateAuctionDto } from '../dto/in/create-auction.dto';
import { Auction } from '../../domain/entity/auction-domain-entity';
import { AuctionMapper } from '../mapper/auction.mapper';
import { AuctionResponseDto } from '../dto/out/auction-response.dto';
import { InventoryCommandService } from '../../../../warehouse/inventory/application/service/inventory-command.service';
import { MovementRequest } from '../../../../warehouse/inventory/domain/ports/in/inventory-movement-ports-in.';

@Injectable()
export class AuctionCommandService implements IAuctionCommandPort {
  private readonly logger = new Logger(AuctionCommandService.name);

  constructor(
    @Inject('IAuctionRepositoryPort')
    private readonly repository: IAuctionRepositoryPort,
    private readonly inventoryService: InventoryCommandService,
  ) {}

  /**
   * Crea una subasta (remate), valida stock y registra la salida en inventario.
   * Si el registro en inventario falla, intenta compensar eliminando la subasta creada.
   */
    async create(dto: CreateAuctionDto): Promise<AuctionResponseDto> {
        // Validaciones básicas
        if (!dto.detalles || dto.detalles.length === 0) {
        throw new BadRequestException('Se requiere al menos un detalle para crear la subasta.');
        }
        if (!dto.id_almacen_ref || dto.id_almacen_ref <= 0) {
        throw new BadRequestException('Se requiere id_almacen_ref válido para descontar stock.');
        }

        // Validar stock para cada detalle
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

        const shouldGenerateCode = !dto.cod_remate || dto.cod_remate.trim() === '';
        
        const temporaryCode = shouldGenerateCode ? 'TEMP-PENDING' : dto.cod_remate!;

        this.logger.log(`Creando remate con código: ${shouldGenerateCode ? 'AUTO-GENERADO' : temporaryCode}`);

        const domain = new Auction(
        temporaryCode, 
        dto.descripcion,
        new Date(dto.fec_fin),
        dto.fec_inicio ? new Date(dto.fec_inicio) : undefined,
        dto.estado as any,
        undefined,
        dto.detalles.map(d => ({
            productId: d.id_producto,
            originalPrice: d.pre_original,
            auctionPrice: d.pre_remate,
            auctionStock: d.stock_remate,
            observacion: d.observacion,
        })),
        );

        if (domain.endAt.getTime() <= domain.startAt.getTime()) {
        throw new BadRequestException('La fecha de fin debe ser posterior a la fecha de inicio.');
        }

        let saved = await this.repository.save(domain);
        this.logger.log(` Remate guardado con ID: ${saved.id}`);

        let finalCode = dto.cod_remate;
        if (shouldGenerateCode) {
        const year = (domain.startAt || new Date()).getFullYear();
        finalCode = `RMT-${year}-${String(saved.id ?? 0).padStart(3, '0')}`;

        this.logger.log(`Generando código automático: ${finalCode}`);

        try {
            saved.code = finalCode;
            saved = await this.repository.save(saved);
            this.logger.log(`Código actualizado a: ${finalCode}`);
        } catch (err) {
            this.logger.error(' Error actualizando código de remate generado', err);
            try { 
            await this.repository.delete(saved.id!); 
            this.logger.warn(` Remate ${saved.id} eliminado (rollback)`);
            } catch (e) { 
            this.logger.error(` Error en rollback`, e);
            }
            throw new InternalServerErrorException('No se pudo generar el código del remate.');
        }
        }

        const exitPayload: MovementRequest = {
        originType: 'AJUSTE' as MovementRequest['originType'],
        refId: saved.id!,
        refTable: 'remate',
        observation: `Remate registrado: ${finalCode}`,
        items: dto.detalles.map((d) => ({
            productId: d.id_producto,
            warehouseId: dto.id_almacen_ref,
            quantity: d.stock_remate,
        })),
        };

        try {
        await this.inventoryService.registerExit(exitPayload);
        this.logger.log(`Salida de inventario registrada para remate ${finalCode}`);
        } catch (err) {
        this.logger.error(`Error registrando salida en inventario para remate id=${saved.id}`, err);
        try {
            await this.repository.delete(saved.id!);
            this.logger.warn(`Remate ${saved.id} eliminado (compensación por error de inventario)`);
        } catch (delErr) {
            this.logger.error(`Error intentando compensar borrando remate id=${saved.id}`, delErr);
        }
        throw new InternalServerErrorException('Error al registrar salida en inventario. Operación revertida.');
        }

        const final = await this.repository.findById(saved.id!);
        this.logger.log(`Remate ${finalCode} creado exitosamente`);
        return AuctionMapper.toResponseDto(final);
    }
    
  async update(id: number, dto: CreateAuctionDto): Promise<AuctionResponseDto> {
    const existing = await this.repository.findById(id);
    if (!existing) throw new BadRequestException('Subasta no encontrada.');

    const domain = existing;
    domain.code = dto.cod_remate;
    domain.description = dto.descripcion;
    domain.endAt = new Date(dto.fec_fin);
    domain.details = dto.detalles.map(d => ({
      productId: d.id_producto,
      originalPrice: d.pre_original,
      auctionPrice: d.pre_remate,
      auctionStock: d.stock_remate,
      observacion: d.observacion,
    }));

    if (domain.endAt.getTime() <= domain.startAt.getTime()) {
      throw new BadRequestException('La fecha de fin debe ser posterior a la fecha de inicio.');
    }

    const saved = await this.repository.save(domain);
    return AuctionMapper.toResponseDto(saved);
  }

  async finalize(id: number): Promise<AuctionResponseDto> {
    const existing = await this.repository.findById(id);
    if (!existing) throw new BadRequestException('Subasta no encontrada.');
    existing.finalize();
    const saved = await this.repository.save(existing);
    return AuctionMapper.toResponseDto(saved);
  }

  async delete(id: number): Promise<void> {
    await this.repository.delete(id);
  }
}