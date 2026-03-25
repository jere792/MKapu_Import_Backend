/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';

import { CreateRemissionDto } from '../dto/in/create-remission.dto';
import {
  Remission,
  RemissionDetail,
} from '../../domain/entity/remission-domain-entity';
import { SalesGateway } from '../../infrastructure/adapters/out/sales-gateway';
import { RemissionPortOut } from '../../domain/ports/out/remission-port-out';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ProductsGateway } from '../../infrastructure/adapters/out/products-gateway';
import { RemissionCommandPortIn } from '../../domain/ports/in/remission-command-port-in';

@Injectable()
export class RemissionCommandService implements RemissionCommandPortIn {
  constructor(
    @Inject('RemissionRepositoryPort')
    private readonly remissionRepository: RemissionPortOut,

    @Inject('SalesGatewayPort')
    private readonly salesGateway: SalesGateway,

    @Inject('ProductsGatewayPort')
    private readonly productsGateway: ProductsGateway,

    private readonly eventEmitter: EventEmitter2,
  ) {}
  async searchSaleToForward(correlativo: string) {
    // 1. Traer venta de Sales
    const venta = await this.salesGateway.findSaleByCorrelativo(correlativo);
    if (!venta) throw new NotFoundException('Venta no encontrada');

    const productRefs = venta.detalles.map((d) => d.id_producto);

    let infoProductos = [];
    try {
      infoProductos = await this.productsGateway.getProductsInfo(productRefs);
    } catch (e) {
      console.error(
        'Fallo crítico en ProductsGateway, usando pesos por defecto',
      );
    }
    const detallesEnriquecidos = venta.detalles.map((detalle) => {
      const infoMaestra = infoProductos?.find(
        (p) => p.id === detalle.id_producto,
      );

      const pesoUnitario = infoMaestra ? Number(infoMaestra.peso) : 1;
      const cantidad = Number(detalle.cantidad);

      return {
        ...detalle,
        cantidad: Number(detalle.cantidad),
        peso_unitario: pesoUnitario,
        peso_total: Number(detalle.cantidad) * pesoUnitario,
      };
    });

    return {
      ...venta,
      detalles: detallesEnriquecidos,
    };
  }

  async createRemission(dto: CreateRemissionDto) {
    try {
      const existingRemission = await this.remissionRepository.findByRefId(
        dto.id_comprobante_ref,
      );
      if (existingRemission) {
        throw new BadRequestException(
          'Ya existe una guía de remisión para esta venta',
        );
      }
      const rawsaleInfo = await this.salesGateway.getValidSaleForDispatch(
        dto.id_comprobante_ref,
      );
      const saleInfo = {
        items: rawsaleInfo.items.map((item) => ({
          codProd: item.codProd,
          quantity: Number(item.quantity),
        })),
      };
      const nextNumero = await this.remissionRepository.getNextCorrelative();

      const detalles = dto.items.map(
        (i) =>
          new RemissionDetail(
            i.id_producto,
            i.cod_prod,
            i.cantidad,
            i.peso_total,
            i.peso_unitario,
          ),
      );

      const remission = Remission.createNew(
        {
          serie: 'T001',
          numero: nextNumero,
          fecha_inicio: new Date(dto.fecha_inicio_traslado),
          motivo_traslado: dto.motivo_traslado,
          modalidad: dto.modalidad,
          tipo_guia: dto.tipo_guia,
          unidad_peso: dto.unidad_peso,
          observaciones: dto.motivo_traslado,
          id_comprobante_ref: dto.id_comprobante_ref,
          id_usuario_ref: dto.id_usuario,
          id_sede_ref: Number(dto.id_sede_origen),
          id_almacen_origen: dto.id_almacen_origen,
          datos_traslado: dto.datos_traslado,
          datos_transporte: dto.datos_transporte,
        },
        detalles,
      );

      remission.validateAgainstSale(saleInfo);

      await this.remissionRepository.save(remission);

      for (const event of remission.domainEvents) {
        this.eventEmitter.emit(event.constructor.name, event);
      }

      remission.clearEvents();

      return {
        success: true,
        message: 'Guía generada correctamente',
        id_guia: remission.id_guia,
        serie_numero: remission.getFullNumber(),
      };
    } catch (error) {
      console.error('Error al generar la guía:', error);
      if (error instanceof BadRequestException || error.name === 'Error') {
        throw new BadRequestException(error.message);
      }
      throw new InternalServerErrorException(
        'Error en el proceso de emisión de guía',
      );
    }
  }
  async changeStatus(
    idGuia: string,
    estado: string,
  ): Promise<{ success: boolean; message: string }> {
    try {
      await this.remissionRepository.changeStatus(idGuia, estado);

      return {
        success: true,
        message: `El estado de la guía se actualizó a ${estado} correctamente`,
      };
    } catch (error) {
      throw new Error(`Error al actualizar el estado: ${error.message}`);
    }
  }
}
