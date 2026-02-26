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
import { SalesReceiptResponseDto } from '../dto/out';

export class SalesReceiptMapper {
  static fromRegisterDto(
    dto: RegisterSalesReceiptDto,
    nextNumber: number,
  ): SalesReceipt {
    const domainItems: SalesReceiptItem[] = dto.items
      ? dto.items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          productName: item.description,
          total: item.total || item.quantity * item.unitPrice,
          igv: item.igv || 0,
        }))
      : [];

    return SalesReceipt.createNew(
      dto.customerId,
      dto.saleTypeId,
      dto.receiptTypeId,
      dto.serie,
      nextNumber,
      new Date(),
      dto.dueDate,
      dto.operationType,
      dto.subtotal,
      dto.igv,
      dto.isc,
      dto.total,
      dto.responsibleId,
      dto.branchId,
      dto.currencyCode,
      domainItems,
    );
  }

  static toDomain(orm: SalesReceiptOrmEntity): SalesReceipt {
    return SalesReceipt.create({
      id_comprobante: orm.id_comprobante,
      id_cliente: orm.cliente?.id_cliente,
      id_tipo_venta: orm.tipoVenta?.id_tipo_venta,
      id_tipo_comprobante: orm.tipoComprobante?.id_tipo_comprobante,
      cod_moneda: orm.moneda?.codigo,
      serie: orm.serie,
      numero: orm.numero,
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
        (detail as any).id_descuento = 1;

        return detail;
      });
    }

    return orm;
  }

  static toResponseDto(domain: SalesReceipt): SalesReceiptResponseDto {
    return {
      idComprobante: domain.id_comprobante,
      idCliente: domain.id_cliente,
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
}
