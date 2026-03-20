/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* sales/src/core/sales-receipt/application/mapper/sales-receipt.mapper.ts */

import {
  SalesReceipt,
  ReceiptStatus,
  SalesReceiptItem,
} from '../../domain/entity/sales-receipt-domain-entity';
import {
  SalesReceiptOrmEntity,
  ReceiptStatusOrm,
} from '../../infrastructure/entity/sales-receipt-orm.entity';
import { SalesReceiptDetailOrmEntity } from '../../infrastructure/entity/sales-receipt-detail-orm.entity';
import { SalesTypeOrmEntity } from '../../infrastructure/entity/sales-type-orm.entity';
import { ReceiptTypeOrmEntity } from '../../infrastructure/entity/receipt-type-orm.entity';
import { SunatCurrencyOrmEntity } from '../../infrastructure/entity/sunat-currency-orm.entity';
import { CustomerOrmEntity } from '../../../customer/infrastructure/entity/customer-orm.entity';
import { RegisterSalesReceiptDto } from '../dto/in';
import {
  SalesReceiptResponseDto,
  SaleTypeResponseDto,
  ReceiptTypeResponseDto,
} from '../dto/out';
import { SalesType } from '../../domain/entity/sale-type-domain-entity';
import { ReceiptType } from '../../domain/entity/receipt-type-domain-entity';

export class SalesReceiptMapper {
  static fromRegisterDto(
    dto: RegisterSalesReceiptDto,
    nextNumber: number,
  ): SalesReceipt {
    if (!dto.serie)
      throw new Error('El campo "serie" es obligatorio y no puede estar vacío');
    if (!dto.items || dto.items.length === 0)
      throw new Error('El comprobante debe contener al menos un item');

    const operationType = dto.operationType ?? '0101';
    const currencyCode = dto.currencyCode ?? 'PEN';
    const descuento = dto.descuento ?? 0;

    const totalFinal = Number((dto.total - descuento).toFixed(2));
    const subtotalFinal = Number((totalFinal / 1.18).toFixed(2));
    const igvFinal = Number((totalFinal - subtotalFinal).toFixed(2));

    const domainItems: SalesReceiptItem[] = dto.items.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      productName: item.description,
      total: item.total || item.quantity * item.unitPrice,
      igv: item.igv || 0,
      codigo: item.codigo, // ← regla PRODUCTO
      categoriaId: item.categoriaId, // ← regla CATEGORIA
    }));

    return SalesReceipt.createNew(
      dto.customerId,
      dto.saleTypeId,
      dto.receiptTypeId,
      dto.serie,
      nextNumber,
      dto.customerName,
      new Date(),
      dto.dueDate,
      operationType,
      subtotalFinal,
      igvFinal,
      dto.isc,
      totalFinal,
      dto.responsibleId,
      dto.branchId,
      currencyCode,
      domainItems,
      dto.promotionId ?? null,
      descuento,
    );
  }

  static toDomain(orm: SalesReceiptOrmEntity): SalesReceipt {
    const domain = SalesReceipt.create({
      id_comprobante: orm.id_comprobante,
      id_cliente: orm.cliente?.id_cliente,
      id_tipo_venta: orm.tipoVenta?.id_tipo_venta,
      id_tipo_comprobante: orm.tipoComprobante?.id_tipo_comprobante,
      cod_moneda: orm.moneda?.codigo,
      serie: orm.serie,
      numero: orm.numero,
      nombre_cliente: orm.nombre_cliente,
      fec_emision: orm.fec_emision,
      fec_venc: orm.fec_venc,
      tipo_operacion: orm.tipo_operacion,
      subtotal: Number(orm.subtotal),
      igv: Number(orm.igv),
      isc: Number(orm.isc),
      total: Number(orm.total),
      estado: orm.estado as unknown as ReceiptStatus,
      id_responsable_ref: orm.id_responsable_ref,
      id_sede_ref: orm.id_sede_ref,
      items:
        orm.details?.map((d) => ({
          productId: d.id_prod_ref,
          quantity: Number(d.cantidad),
          unitPrice: Number(d.pre_uni),
          productName: d.descripcion || '',
          total: Number(d.cantidad) * Number(d.pre_uni),
          igv: Number(d.igv),
        })) || [],
    });
    if (orm.cliente) {
      (domain as any).clienteOriginal = orm.cliente;
    }
    return domain;
  }

  static toOrm(domain: SalesReceipt): SalesReceiptOrmEntity {
    const orm = new SalesReceiptOrmEntity();
    if (domain.id_comprobante !== undefined)
      orm.id_comprobante = domain.id_comprobante;
    orm.cliente = { id_cliente: domain.id_cliente } as CustomerOrmEntity;
    orm.tipoVenta = {
      id_tipo_venta: domain.id_tipo_venta,
    } as SalesTypeOrmEntity;
    orm.tipoComprobante = {
      id_tipo_comprobante: domain.id_tipo_comprobante,
    } as ReceiptTypeOrmEntity;
    orm.moneda = { codigo: domain.cod_moneda } as SunatCurrencyOrmEntity;

    orm.serie = domain.serie;
    orm.numero = domain.numero;
    orm.fec_emision = domain.fec_emision;
    orm.fec_venc = domain.fec_venc;
    orm.tipo_operacion = domain.tipo_operacion;
    orm.subtotal = domain.subtotal;
    orm.igv = domain.igv;
    orm.isc = domain.isc;
    orm.total = domain.total;
    orm.estado = domain.estado as unknown as ReceiptStatusOrm;
    orm.id_responsable_ref = domain.id_responsable_ref;
    orm.id_sede_ref = domain.id_sede_ref;

    if (domain.items && domain.items.length > 0) {
      orm.details = domain.items.map((item) => {
        const detail = new SalesReceiptDetailOrmEntity();
        detail.id_prod_ref = item.productId;
        detail.cod_prod = item.productId;
        detail.cantidad = Math.round(item.quantity);
        detail.pre_uni = item.unitPrice;
        detail.valor_uni = item.unitPrice;
        detail.igv = item.igv || 0;
        detail.descripcion = (
          item.productName ||
          item.description ||
          ''
        ).substring(0, 45);
        (detail as any).tipo_afectacion_igv = 1;
        (detail as any).id_descuento = item.discountId ?? null;
        return detail;
      });
    }

    return orm;
  }

  static toResponseDto(domain: SalesReceipt): SalesReceiptResponseDto {
    const clienteOrm = (domain as any).clienteOriginal;
    return {
      idComprobante: domain.id_comprobante,
      idCliente: domain.id_cliente,

      cliente: clienteOrm
        ? {
            numero_documento:
              clienteOrm.valor_doc || clienteOrm.numero_documento,
            nombres: clienteOrm.nombres,
            apellidos: clienteOrm.apellidos,
            razon_social: clienteOrm.razon_social,
            direccion: clienteOrm.direccion || 'Sin dirección',
          }
        : null,

      numeroCompleto: domain.getFullNumber(),
      serie: domain.serie,
      numero: domain.numero,
      fecEmision: domain.fec_emision,
      fecVenc: domain.fec_venc,
      tipoOperacion: domain.tipo_operacion,
      subtotal: domain.subtotal,
      igv: domain.igv,
      isc: domain.isc,
      total: domain.total,
      estado: domain.estado,
      codMoneda: domain.cod_moneda,
      idTipoComprobante: domain.id_tipo_comprobante,
      idTipoVenta: domain.id_tipo_venta,
      idSedeRef: domain.id_sede_ref,
      idResponsableRef: domain.id_responsable_ref,
      items: domain.items.map((item) => ({
        productId: item.productId,
        productName: item.productName || item.description || '',
        codigoProducto: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        unitValue: item.unitPrice,
        igv: item.igv,
        tipoAfectacionIgv: item.igv || 1,
        total: item.total,
      })),
    };
  }

  static toSaleTypeDto(domain: SalesType): SaleTypeResponseDto {
    return {
      id: domain.id_tipo_venta!,
      tipo: domain.tipo,
      descripcion: domain.descripcion,
    };
  }

  static toReceiptTypeDto(domain: ReceiptType): ReceiptTypeResponseDto {
    return {
      id: domain.id_tipo_comprobante!,
      codSunat: domain.cod_sunat,
      descripcion: domain.descripcion,
      estado: domain.estado,
    };
  }
}
