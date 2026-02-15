import { Injectable, Inject, BadRequestException, Logger } from '@nestjs/common';
import { IWastageCommandPort } from '../../domain/ports/in/wastage.port.in';
import { IWastageRepositoryPort } from '../../domain/ports/out/wastage.port.out';
import { CreateWastageDto } from '../dto/in/create-wastage.dto';
import { WastageResponseDto } from '../dto/out/wastage-response.dto';
import { WastageMapper } from '../mapper/wastage.mapper';
import { Wastage, WastageDetail } from '../../domain/entity/wastage-domain-intity';
import { InventoryCommandService } from '../../../../warehouse/inventory/application/service/inventory-command.service';

@Injectable()
export class WastageCommandService implements IWastageCommandPort {
  private readonly logger = new Logger(WastageCommandService.name);

  constructor(
    @Inject('IWastageRepositoryPort')
    private readonly repository: IWastageRepositoryPort,
    private readonly inventoryService: InventoryCommandService,
  ) {}

  async create(dto: CreateWastageDto): Promise<WastageResponseDto> {
    // 1) Validar stock para cada detalle
    for (const item of dto.detalles) {
      const stockDisponible = await this.inventoryService.getStockLevel(
        item.id_producto,
        dto.id_almacen_ref,
      );
      if (!stockDisponible || stockDisponible < item.cantidad) {
        throw new BadRequestException(
          `Stock insuficiente para el producto ID ${item.id_producto}. ` +
          `Disponible: ${stockDisponible || 0}, Requerido: ${item.cantidad}`,
        );
      }
    }

    // 2) Mapear detalles al modelo de dominio
    const detalles: WastageDetail[] = dto.detalles.map(
      (d) =>
        new WastageDetail(
          null,
          d.id_producto,
          d.cod_prod,
          d.desc_prod,
          d.cantidad,
          d.pre_unit,
          d.id_tipo_merma,
          d.observacion,
        ),
    );

    if (!detalles || detalles.length === 0) {
      throw new BadRequestException('Se requiere al menos un detalle de merma.');
    }

    // 3) Crear entidad de dominio Wastage (cabecera)
    const domain = new Wastage(
      null,
      dto.id_usuario_ref,
      dto.id_sede_ref,
      dto.id_almacen_ref,
      dto.motivo,
      new Date(),
      true,
      detalles,
    );

    // 4) Asegurar que exista un id_tipo_merma a nivel de cabecera
    //    Política: usamos el id_tipo_merma del primer detalle si no se proporciona otro valor.
    const firstDetailTipo = (detalles[0] as any).id_tipo_merma;
    if (firstDetailTipo === undefined || firstDetailTipo === null) {
      throw new BadRequestException('Se requiere id_tipo_merma en al menos un detalle.');
    }
    // Asignamos un campo ad-hoc en el dominio que el repository debe mapear a orm.id_tipo_merma
    (domain as any).tipo_merma_id = Number(firstDetailTipo);

    // Asegurar que cada detalle tenga id_tipo_merma definido (si algún detalle viene sin él, se rellena con el de la cabecera)
    for (const d of domain.detalles) {
      const dt = d as any;
      if (dt.id_tipo_merma === undefined || dt.id_tipo_merma === null) {
        dt.id_tipo_merma = (domain as any).tipo_merma_id;
      }
    }

    // 5) Log para debugging previo a persistir
    this.logger.debug('[WastageCommandService] DTO incoming: ' + JSON.stringify(dto));
    this.logger.debug('[WastageCommandService] Domain before save: ' + JSON.stringify({
      id_usuario_ref: domain.id_usuario_ref,
      id_sede_ref: domain.id_sede_ref,
      id_almacen_ref: domain.id_almacen_ref,
      motivo: domain.motivo,
      tipo_merma_id: (domain as any).tipo_merma_id,
      detalles: domain.detalles?.map(d => ({ id_producto: d.id_producto, id_tipo_merma: (d as any).id_tipo_merma })),
    }));

    // 6) Guardar mediante repository (la implementación del repositorio debe mapear domain.tipo_merma_id -> orm.id_tipo_merma)
    const savedWastage = await this.repository.save(domain);

    // 7) Registrar salida en inventario
    await this.inventoryService.registerExit({
      originType: 'AJUSTE',
      refId: savedWastage.id_merma!,
      refTable: 'merma',
      observation: `Merma registrada: ${dto.motivo}`,
      items: dto.detalles.map((d) => ({
        productId: d.id_producto,
        warehouseId: dto.id_almacen_ref,
        quantity: d.cantidad,
      })),
    });

    return WastageMapper.toResponseDto(savedWastage);
  }
}