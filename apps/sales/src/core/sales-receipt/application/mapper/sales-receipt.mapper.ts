/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* ============================================
   apps/sales/src/core/sales-receipt/application/mapper/sales-receipt.mapper.ts
   ============================================ */

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
  SalesReceiptItemResponseDto,
  SalesReceiptCustomerResponseDto,
  SalesReceiptEmployeeResponseDto,
  SalesReceiptTypeResponseDto,
  SalesTypeResponseDto,
  BranchResponseDto,
  PaymentMethodResponseDto,
  CurrencyResponseDto,
  SalesReceiptSummaryDto,
  SalesReceiptSummaryListResponse,
  CustomerPurchaseHistoryDto,
  SalesReceiptWithHistoryDto,
} from '../dto/out';

export class SalesReceiptMapper {

  // ─── REGISTER DTO → DOMAIN ───────────────────────────────────────────────

  static fromRegisterDto(
    dto: RegisterSalesReceiptDto,
    nextNumber: number,
  ): SalesReceipt {
    const domainItems: SalesReceiptItem[] = dto.items
      ? dto.items.map((item) => ({
          productId:   item.productId,
          quantity:    item.quantity,
          unitPrice:   item.unitPrice,
          productName: item.description,
          total:       item.total || item.quantity * item.unitPrice,
          igv:         item.igv || 0,
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

  // ─── ORM → DOMAIN ────────────────────────────────────────────────────────

  static toDomain(orm: SalesReceiptOrmEntity): SalesReceipt {
    return SalesReceipt.create({
      id_comprobante:       orm.id_comprobante,
      id_cliente:           orm.cliente?.id_cliente,
      id_tipo_venta:        orm.tipoVenta?.id_tipo_venta,
      id_tipo_comprobante:  orm.tipoComprobante?.id_tipo_comprobante,
      cod_moneda:           orm.moneda?.codigo,
      serie:                orm.serie,
      numero:               orm.numero,
      fec_emision:          orm.fec_emision,
      fec_venc:             orm.fec_venc,
      tipo_operacion:       orm.tipo_operacion,
      subtotal:             Number(orm.subtotal),
      igv:                  Number(orm.igv),
      isc:                  Number(orm.isc),
      total:                Number(orm.total),
      estado:               orm.estado as unknown as ReceiptStatus,
      id_responsable_ref:   orm.id_responsable_ref,
      id_sede_ref:          orm.id_sede_ref,
      items:
        orm.details?.map((d) => ({
          productId:   d.id_prod_ref,
          quantity:    Number(d.cantidad),
          unitPrice:   Number(d.pre_uni),
          productName: d.descripcion || '',
          total:       Number(d.cantidad) * Number(d.pre_uni),
          igv:         Number(d.igv),
        })) || [],
    });
  }

  // ─── DOMAIN → ORM ────────────────────────────────────────────────────────

  static toOrm(domain: SalesReceipt): SalesReceiptOrmEntity {
    const orm = new SalesReceiptOrmEntity();

    if (domain.id_comprobante !== undefined)
      orm.id_comprobante = domain.id_comprobante;

    orm.cliente         = { id_cliente: domain.id_cliente } as CustomerOrmEntity;
    orm.tipoVenta       = { id_tipo_venta: domain.id_tipo_venta } as SalesTypeOrmEntity;
    orm.tipoComprobante = { id_tipo_comprobante: domain.id_tipo_comprobante } as ReceiptTypeOrmEntity;
    orm.moneda          = { codigo: domain.cod_moneda } as SunatCurrencyOrmEntity;

    orm.serie               = domain.serie;
    orm.numero              = domain.numero;
    orm.fec_emision         = domain.fec_emision;
    orm.fec_venc            = domain.fec_venc;
    orm.tipo_operacion      = domain.tipo_operacion;
    orm.subtotal            = domain.subtotal;
    orm.igv                 = domain.igv;
    orm.isc                 = domain.isc;
    orm.total               = domain.total;
    orm.estado              = domain.estado as unknown as ReceiptStatusOrm;
    orm.id_responsable_ref  = domain.id_responsable_ref;
    orm.id_sede_ref         = domain.id_sede_ref;

    if (domain.items?.length > 0) {
      orm.details = domain.items.map((item) => {
        const detail            = new SalesReceiptDetailOrmEntity();
        detail.id_prod_ref      = item.productId;
        detail.cantidad         = Math.round(item.quantity);
        detail.pre_uni          = item.unitPrice;
        detail.valor_uni        = item.unitPrice;
        detail.igv              = item.igv || 0;
        detail.descripcion      = (item.productName || item.description || '').substring(0, 45);
        (detail as any).tipo_afectacion_igv = 1;
        (detail as any).id_descuento        = 1;
        return detail;
      });
    }

    return orm;
  }

  // ─── ORM → RESPONSE DTO (con objetos anidados) ───────────────────────────

  static ormToResponseDto(orm: SalesReceiptOrmEntity): SalesReceiptResponseDto {
    const domain = this.toDomain(orm);

    const cliente: SalesReceiptCustomerResponseDto = {
      id:                      orm.cliente?.id_cliente || domain.id_cliente,
      documentTypeId:          orm.cliente?.id_tipo_documento || 0,
      documentTypeDescription: orm.cliente?.tipoDocumento?.descripcion || '',
      documentTypeSunatCode:   orm.cliente?.tipoDocumento?.cod_sunat || '',
      documentValue:           orm.cliente?.valor_doc || '',
      name:                    orm.cliente?.nombres || '',
      address:                 orm.cliente?.direccion,
      email:                   orm.cliente?.email,
      phone:                   orm.cliente?.telefono,
      status:                  orm.cliente?.estado ?? true,
    };

    const responsable: SalesReceiptEmployeeResponseDto = {
      id:              Number(domain.id_responsable_ref),
      nombre:          '',
      apellidoPaterno: '',
      apellidoMaterno: '',
      nombreCompleto:  '',
    };

    const tipoComprobante: SalesReceiptTypeResponseDto = {
      id:          orm.tipoComprobante?.id_tipo_comprobante || domain.id_tipo_comprobante,
      codigoSunat: orm.tipoComprobante?.cod_sunat || '',
      descripcion: orm.tipoComprobante?.descripcion || '',
    };

    const tipoVenta: SalesTypeResponseDto = {
      id:          orm.tipoVenta?.id_tipo_venta || domain.id_tipo_venta,
      tipo:        orm.tipoVenta?.tipo || '',
      descripcion: orm.tipoVenta?.descripcion || '',
    };

    const sede: BranchResponseDto = {
      id:     domain.id_sede_ref,
      nombre: '',
    };

    const metodoPago: PaymentMethodResponseDto | undefined = orm.payment?.paymentType
      ? {
          id:           orm.payment.paymentType.id,
          codigoSunat:  orm.payment.paymentType.codSunat,
          descripcion:  orm.payment.paymentType.descripcion,
        }
      : undefined;

    const moneda: CurrencyResponseDto = {
      codigo:      orm.moneda?.codigo || domain.cod_moneda,
      descripcion: orm.moneda?.descripcion || '',
    };

    const items: SalesReceiptItemResponseDto[] = domain.items.map((item) => ({
      productId:         item.productId,
      productName:       item.productName || item.description || '',
      codigoProducto:    item.productId,
      quantity:          item.quantity,
      unitPrice:         item.unitPrice,
      unitValue:         item.unitPrice,
      igv:               item.igv || 0,
      tipoAfectacionIgv: 1,
      total:             item.total || item.quantity * item.unitPrice,
    }));

    return {
      idComprobante:  domain.id_comprobante!,
      numeroCompleto: domain.getFullNumber(),
      serie:          domain.serie,
      numero:         domain.numero,
      fecEmision:     domain.fec_emision,
      fecVenc:        domain.fec_venc,
      tipoOperacion:  domain.tipo_operacion,
      subtotal:       domain.subtotal,
      igv:            domain.igv,
      isc:            domain.isc,
      total:          domain.total,
      estado:         domain.estado,
      cliente,
      responsable,
      tipoComprobante,
      tipoVenta,
      sede,
      metodoPago,
      moneda,
      items,
    };
  }

  // ─── DOMAIN → RESPONSE DTO (usado por command service) ───────────────────

  static toResponseDto(domain: SalesReceipt): SalesReceiptResponseDto {
    return {
      idComprobante:  domain.id_comprobante!,
      numeroCompleto: domain.getFullNumber(),
      serie:          domain.serie,
      numero:         domain.numero,
      fecEmision:     domain.fec_emision,
      fecVenc:        domain.fec_venc,
      tipoOperacion:  domain.tipo_operacion,
      subtotal:       domain.subtotal,
      igv:            domain.igv,
      isc:            domain.isc,
      total:          domain.total,
      estado:         domain.estado,
      cliente: {
        id:                      domain.id_cliente,
        documentTypeId:          0,
        documentTypeDescription: '',
        documentTypeSunatCode:   '',
        documentValue:           '',
        name:                    '',
        status:                  true,
      },
      responsable: {
        id:              Number(domain.id_responsable_ref),
        nombre:          '',
        apellidoPaterno: '',
        apellidoMaterno: '',
        nombreCompleto:  '',
      },
      tipoComprobante: {
        id:          domain.id_tipo_comprobante,
        codigoSunat: '',
        descripcion: '',
      },
      tipoVenta: {
        id:          domain.id_tipo_venta,
        tipo:        '',
        descripcion: '',
      },
      sede: {
        id:     domain.id_sede_ref,
        nombre: '',
      },
      moneda: {
        codigo:      domain.cod_moneda,
        descripcion: '',
      },
      items: domain.items.map((item) => ({
        productId:         item.productId,
        productName:       item.productName || item.description || '',
        codigoProducto:    item.productId,
        quantity:          item.quantity,
        unitPrice:         item.unitPrice,
        unitValue:         item.unitPrice,
        igv:               item.igv || 0,
        tipoAfectacionIgv: 1,
        total:             item.total || item.quantity * item.unitPrice,
      })),
    };
  }

  // ─── ORM → SUMMARY DTO ───────────────────────────────────────────────────

  static ormToSummaryDto(orm: SalesReceiptOrmEntity): SalesReceiptSummaryDto {
    const domain = this.toDomain(orm);

    return {
      idComprobante:     domain.id_comprobante!,
      numeroCompleto:    domain.getFullNumber(),
      serie:             domain.serie,
      numero:            domain.numero,
      tipoComprobante:   orm.tipoComprobante?.descripcion || '',
      fecEmision:        domain.fec_emision,
      clienteNombre:     orm.cliente?.nombres || '',
      clienteDocumento:  orm.cliente?.valor_doc || '',
      idResponsable:     domain.id_responsable_ref,
      responsableNombre: '',
      idSede:            domain.id_sede_ref,
      sedeNombre:        '',
      metodoPago:        orm.payment?.paymentType?.descripcion || '',
      total:             domain.total,
      estado:            domain.estado,
    };
  }

  static toSummaryListResponse(
    orms: SalesReceiptOrmEntity[],
    total: number,
  ): SalesReceiptSummaryListResponse {
    return {
      receipts: orms.map((orm) => this.ormToSummaryDto(orm)),
      total,
    };
  }

  // ─── HISTORIAL DE CLIENTE ─────────────────────────────────────────────────

  static toCustomerHistoryDto(data: {
    customer: {
      id_cliente:     string;
      nombres:        string;
      valor_doc:      string;
      tipoDocumento?: { descripcion: string };
    };
    statistics: {
      totalCompras:   number;
      totalEmitidos:  number;
      totalAnulados:  number;
      montoTotal:     number;
      montoEmitido:   number;
      promedioCompra: number;
    };
    recentPurchases: SalesReceiptOrmEntity[];
  }): CustomerPurchaseHistoryDto {
    const recentPurchases = Array.isArray(data.recentPurchases)
      ? data.recentPurchases
      : [];

    return {
      customer: {
        id:             data.customer.id_cliente,
        nombre:         data.customer.nombres,
        documento:      data.customer.valor_doc,
        tipoDocumento:  data.customer.tipoDocumento?.descripcion || 'DNI',
      },
      statistics: {
        totalCompras:   data.statistics.totalCompras,
        totalEmitidos:  data.statistics.totalEmitidos,
        totalAnulados:  data.statistics.totalAnulados,
        montoTotal:     data.statistics.montoTotal,
        montoEmitido:   data.statistics.montoEmitido,
        promedioCompra: data.statistics.promedioCompra,
      },
      recentPurchases: recentPurchases.map((orm) => ({
        idComprobante:    orm.id_comprobante,
        numeroCompleto:   `${orm.serie}-${String(orm.numero).padStart(8, '0')}`,
        tipoComprobante:  orm.tipoComprobante?.descripcion || 'BOLETA',
        fecha:            orm.fec_emision instanceof Date
                            ? orm.fec_emision
                            : new Date(orm.fec_emision),
        sedeNombre:        '',
        responsableNombre: '',
        total:             Number(orm.total),
        estado:            orm.estado as any,
        id_sede_ref:       orm.id_sede_ref,
        id_responsable_ref: orm.id_responsable_ref,
      } as any)),
    };
  }

  static toWithHistoryDto(
    receiptOrm: SalesReceiptOrmEntity,
    customerHistory?: CustomerPurchaseHistoryDto,
  ): SalesReceiptWithHistoryDto {
    return {
      receipt: this.ormToResponseDto(receiptOrm),
      customerHistory,
    };
  }
}
