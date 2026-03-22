/* eslint-disable @typescript-eslint/no-redundant-type-constituents */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/unbound-method */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Response } from 'express';
import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ISalesReceiptQueryPort } from '../../domain/ports/in/sales_receipt-ports-in';
import { ISalesReceiptRepositoryPort } from '../../domain/ports/out/sales_receipt-ports-out';
import { ICustomerRepositoryPort } from '../../../customer/domain/ports/out/customer-port-out';
import { ListSalesReceiptFilterDto } from '../dto/in';
import {
  SalesReceiptResponseDto,
  SalesReceiptListResponse,
  SalesReceiptKpiDto,
  SalesReceiptSummaryListDto,
  SalesReceiptSummaryItemDto,
  SalesReceiptDetalleCompletoDto,
  SaleTypeResponseDto,
  ReceiptTypeResponseDto,
} from '../dto/out';
import { SalesReceiptMapper } from '../mapper/sales-receipt.mapper';

import { UsersTcpProxy } from '../../infrastructure/adapters/out/TCP/users-tcp.proxy';
import { SedeTcpProxy } from '../../infrastructure/adapters/out/TCP/sede-tcp.proxy';
import { LogisticsTcpProxy } from '../../infrastructure/adapters/out/TCP/logistics-tcp.proxy';
import { EmpresaTcpProxy } from '../../infrastructure/adapters/out/TCP/empresa-tcp.proxy';
import { buildSalesReceiptThermalPdf } from '../../utils/sales-receipt-thermal.util';

@Injectable()
export class SalesReceiptQueryService implements ISalesReceiptQueryPort {
  constructor(
    @Inject('ISalesReceiptRepositoryPort')
    private readonly receiptRepository: ISalesReceiptRepositoryPort,

    @Inject('ICustomerRepositoryPort')
    private readonly customerRepository: ICustomerRepositoryPort,

    private readonly usersTcpProxy: UsersTcpProxy,
    private readonly sedeTcpProxy: SedeTcpProxy,
    private readonly logisticsTcpProxy: LogisticsTcpProxy,
    private readonly empresaTcpProxy: EmpresaTcpProxy, // <-- Proxy inyectado correctamente
  ) {}

  async findSaleByCorrelativo(correlativo: string): Promise<any> {
    const parts = correlativo.split('-');
    if (parts.length !== 2) {
      throw new BadRequestException(
        'El formato del correlativo debe ser SERIE-NUMERO (Ej: F001-123)',
      );
    }
    const [serie, numeroStr] = parts;
    const numero = parseInt(numeroStr, 10);
    const sale = await this.receiptRepository.findByCorrelativo(serie, numero);
    if (!sale) {
      throw new NotFoundException(
        `No se encontró el comprobante ${correlativo}`,
      );
    }
    const nombreRealCliente =
      sale.nombre_cliente ||
      sale.cliente?.razon_social ||
      `${sale.cliente?.nombres || ''} ${sale.cliente?.apellidos || ''}`.trim() ||
      'Cliente Genérico';
    return {
      id: sale.id_comprobante,
      id_sede: sale.id_sede_ref,

      nombre_cliente: nombreRealCliente,
      cliente_documento:
        sale.cliente?.valor_doc || sale.cliente?.valor_doc || null,

      fec_emision: sale.fec_emision,
      total: sale.total,

      cliente_direccion:
        (sale as any).direccion_entrega || 'Dirección no especificada',
      cliente_ubigeo: (sale as any).ubigeo_destino || '150101',

      detalles: sale.details.map((d) => ({
        id_producto: d.id_prod_ref,
        cod_prod: d.cod_prod,
        cantidad: d.cantidad,
        peso_unitario: d.id_prod_ref,
      })),
    };
  }

  async verifySaleForRemission(id: number): Promise<any> {
    const sale = await this.receiptRepository.findById(id);
    if (!sale) return null;
    return {
      id: sale.id_comprobante || id,
      detalles: (sale.items || []).map((item) => ({
        cod_prod: item.productId,
        cantidad: item.quantity,
      })),
    };
  }

  async findCustomerByDocument(documentNumber: string): Promise<any> {
    const customer =
      await this.customerRepository.findByDocument(documentNumber);
    if (!customer) {
      throw new NotFoundException(
        `No se encontró ningún cliente con el documento: ${documentNumber}`,
      );
    }
    return customer;
  }

  async listReceipts(
    filters?: ListSalesReceiptFilterDto,
  ): Promise<SalesReceiptListResponse> {
    const repoFilters = filters
      ? {
          estado: filters.status,
          id_cliente: filters.customerId,
          id_tipo_comprobante: filters.receiptTypeId,
          fec_desde: filters.dateFrom,
          fec_hasta: filters.dateTo,
          search: filters.search,
        }
      : undefined;

    const receipts = await this.receiptRepository.findAll(repoFilters);
    return {
      receipts: receipts.map((r) => SalesReceiptMapper.toResponseDto(r)),
      total: receipts.length,
    };
  }

  async getReceiptById(id: number): Promise<SalesReceiptResponseDto | null> {
    const receipt = await this.receiptRepository.findById(id);
    return receipt ? SalesReceiptMapper.toResponseDto(receipt) : null;
  }

  async getReceiptsBySerie(serie: string): Promise<SalesReceiptListResponse> {
    const receipts = await this.receiptRepository.findBySerie(serie);
    return {
      receipts: receipts.map((r) => SalesReceiptMapper.toResponseDto(r)),
      total: receipts.length,
    };
  }

  async getKpiSemanal(sedeId?: number): Promise<SalesReceiptKpiDto> {
    const raw = await this.receiptRepository.getKpiSemanal(sedeId);

    const ahora = new Date();
    const diaSemana = ahora.getDay();
    const diffLunes = diaSemana === 0 ? 6 : diaSemana - 1;

    const lunes = new Date(ahora);
    lunes.setDate(ahora.getDate() - diffLunes);
    lunes.setHours(0, 0, 0, 0);

    const domingo = new Date(lunes);
    domingo.setDate(lunes.getDate() + 6);

    return {
      total_ventas: raw.total_ventas,
      cantidad_ventas: raw.cantidad_ventas,
      total_boletas: raw.total_boletas,
      total_facturas: raw.total_facturas,
      cantidad_boletas: raw.cantidad_boletas,
      cantidad_facturas: raw.cantidad_facturas,
      semana_desde: lunes.toISOString().split('T')[0],
      semana_hasta: domingo.toISOString().split('T')[0],
    };
  }

  async listReceiptsPaginated(
    filters: ListSalesReceiptFilterDto,
  ): Promise<SalesReceiptSummaryListDto> {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 10;

    const [rows, total] = await this.receiptRepository.findAllPaginated(
      {
        estado: filters.status,
        id_cliente: filters.customerId,
        id_tipo_comprobante: filters.receiptTypeId,
        id_metodo_pago: filters.paymentMethodId,
        fec_desde: filters.dateFrom,
        fec_hasta: filters.dateTo,
        search: filters.search,
        sedeId: filters.sedeId,
      },
      page,
      limit,
    );

    const responsableIds = [
      ...new Set(
        rows
          .map((r) => Number(r.id_responsable))
          .filter((n) => !Number.isNaN(n) && n > 0),
      ),
    ];

    const sedeIds = [...new Set(rows.map((r) => r.id_sede).filter(Boolean))];

    const [usuarios, sedes] = await Promise.all([
      responsableIds.length > 0
        ? this.usersTcpProxy.findByIds(responsableIds)
        : Promise.resolve([]),
      Promise.all(
        sedeIds.map((id) =>
          this.sedeTcpProxy
            .getSedeById(id)
            .then((s) => ({ id_sede: id, nombre: s?.nombre ?? '—' })),
        ),
      ),
    ]);

    const usuarioMap = new Map(
      usuarios.map((u) => [u.id_usuario, u.nombreCompleto]),
    );
    const sedeMap = new Map(sedes.map((s) => [s.id_sede, s.nombre]));

    const receipts: SalesReceiptSummaryItemDto[] = rows.map((r) => ({
      idComprobante: r.id_comprobante,
      numeroCompleto: `${r.serie}-${String(r.numero).padStart(8, '0')}`,
      serie: r.serie,
      numero: r.numero,
      tipoComprobante: r.tipo_comprobante,
      fecEmision: r.fec_emision,
      clienteNombre: r.cliente_nombre || '—',
      clienteDocumento: r.cliente_doc,
      idResponsable: r.id_responsable,
      responsableNombre: usuarioMap.get(Number(r.id_responsable)) ?? '—',
      idSede: r.id_sede,
      sedeNombre: sedeMap.get(r.id_sede) ?? '—',
      metodoPago: r.metodo_pago,
      total: r.total,
      estado: r.estado,
    }));

    return {
      receipts,
      total,
      page,
      limit,
      total_pages: Math.ceil(total / limit),
    };
  }

  async getDetalleCompleto(
    id_comprobante: number,
    historialPage: number = 1,
  ): Promise<SalesReceiptDetalleCompletoDto | null | any> {
    const HISTORIAL_LIMIT = 5;

    const raw = await this.receiptRepository.findDetalleCompleto(
      id_comprobante,
      historialPage,
      HISTORIAL_LIMIT,
    );
    if (!raw) return null;

    const {
      comprobante,
      productos,
      historial,
      historialTotal,
      statsCliente,
      promocion,
    } = raw;

    const idResponsablePrincipal = Number(comprobante.id_responsable);

    const historialResponsableIds = [
      ...new Set(
        (historial as any[])
          .map((h) => Number(h.id_responsable))
          .filter((n) => !Number.isNaN(n) && n > 0),
      ),
    ];

    const todosIds = [
      ...new Set([
        ...(idResponsablePrincipal > 0 ? [idResponsablePrincipal] : []),
        ...historialResponsableIds,
      ]),
    ];

    const productIds = [
      ...new Set(
        (productos as any[])
          .map((p) => Number(p.id_prod_ref))
          .filter((id) => !isNaN(id) && id > 0),
      ),
    ];

    const idSede = Number(comprobante.id_sede);

    const [usuarios, sedeInfo, codigoMap, empresaData] = await Promise.all([
      todosIds.length > 0
        ? this.usersTcpProxy.findByIds(todosIds)
        : Promise.resolve([]),
      this.sedeTcpProxy.getSedeById(idSede),
      productIds.length > 0
        ? this.logisticsTcpProxy.getProductsCodigoByIds(productIds)
        : Promise.resolve(new Map<number, string>()),
      this.empresaTcpProxy.getEmpresaActiva(),
    ]);
    const usuarioMap = new Map(
      usuarios.map((u) => [u.id_usuario, u.nombreCompleto]),
    );
    const nombreSede = sedeInfo?.nombre ?? `Sede ${idSede}`;
    const nombreResponsable =
      usuarioMap.get(idResponsablePrincipal) ??
      `Usuario ${idResponsablePrincipal}`;
    const nombreCliente =
      comprobante.cliente_nombre?.trim() || comprobante.cliente_doc || '—';

    const totalGastadoFinal =
      comprobante.estado !== 'ANULADO'
        ? statsCliente.total_gastado
        : statsCliente.total_gastado - Number(comprobante.total);

    const cantidadComprasFinal =
      comprobante.estado !== 'ANULADO'
        ? statsCliente.cantidad_compras
        : statsCliente.cantidad_compras - 1;

    return {
      id_comprobante: Number(comprobante.id_comprobante),
      numero_completo: `${comprobante.serie}-${String(comprobante.numero).padStart(8, '0')}`,
      serie: comprobante.serie,
      numero: Number(comprobante.numero),
      tipo_comprobante: comprobante.tipo_comprobante ?? '—',
      fec_emision: comprobante.fec_emision,
      fec_venc: comprobante.fec_venc ?? null,
      estado: comprobante.estado,
      subtotal: Number(comprobante.subtotal),
      igv: Number(comprobante.igv),
      total: Number(comprobante.total),
      metodo_pago: comprobante.metodo_pago,

      cliente: {
        id_cliente: comprobante.cliente_id,
        nombre: nombreCliente,
        documento: comprobante.cliente_doc,
        tipo_documento: comprobante.cliente_tipo_doc ?? '—',
        direccion: comprobante.cliente_direccion ?? '',
        email: comprobante.cliente_email ?? '',
        telefono: comprobante.cliente_telefono ?? '',
        total_gastado_cliente: totalGastadoFinal,
        cantidad_compras: cantidadComprasFinal,
      },

      productos: (productos as any[]).map((p) => {
        const codigoReal = codigoMap.get(Number(p.id_prod_ref));
        const montoPromo =
          p.descuento_promo_monto != null
            ? Number(p.descuento_promo_monto)
            : null;
        const baseItemSinIgv = Number(
          (Number(p.cantidad) * Number(p.precio_unit)).toFixed(2),
        );

        return {
          id_prod_ref: p.id_prod_ref,
          cod_prod: codigoReal ?? p.cod_prod ?? p.id_prod_ref,
          descripcion: p.descripcion,
          cantidad: Number(p.cantidad),
          precio_unit: Number(p.precio_unit),
          igv: Number(p.igv),
          total: Number(p.total),
          descuento_nombre: p.descuento_nombre || null,
          descuento_porcentaje: Number(p.descuento_porcentaje) || null,
          promocion_aplicada: Boolean(p.promocion_aplicada),
          descuento_promo_monto: montoPromo,
          descuento_promo_porcentaje:
            montoPromo != null && baseItemSinIgv > 0
              ? Number(((montoPromo / baseItemSinIgv) * 100).toFixed(2))
              : null,
        };
      }),

      responsable: {
        id: comprobante.id_responsable,
        nombre: nombreResponsable,
        sede: idSede,
        nombreSede,
      },

      promocion: promocion
        ? {
            id: promocion.id,
            codigo: promocion.codigo,
            nombre: promocion.nombre,
            tipo: promocion.tipo,
            monto_descuento: promocion.monto_descuento,
            descuento_nombre: promocion.descuento_nombre,
            descuento_porcentaje: promocion.descuento_porcentaje,
            reglas: promocion.reglas ?? [],
            productosIds: promocion.productosIds ?? [],
          }
        : null,

      historial_cliente: (historial as any[]).map((h) => ({
        id_comprobante: Number(h.id_comprobante),
        numero_completo: `${h.serie}-${String(h.numero).padStart(8, '0')}`,
        fec_emision: h.fec_emision,
        total: Number(h.total),
        estado: h.estado,
        metodo_pago: h.metodo_pago,
        responsable: usuarioMap.get(Number(h.id_responsable)) ?? '—',
      })),

      historial_pagination: {
        total: historialTotal,
        page: historialPage,
        limit: HISTORIAL_LIMIT,
        total_pages: Math.ceil(historialTotal / HISTORIAL_LIMIT),
      },
      empresa: empresaData, // <-- Inyectamos la empresa para el Frontend
    };
  }

  async getAllSaleTypes(): Promise<SaleTypeResponseDto[]> {
    const types = await this.receiptRepository.findAllSaleTypes();
    return types.map(SalesReceiptMapper.toSaleTypeDto);
  }

  async getAllReceiptTypes(): Promise<ReceiptTypeResponseDto[]> {
    const types = await this.receiptRepository.findAllReceiptTypes();
    return types.map(SalesReceiptMapper.toReceiptTypeDto);
  }

  private async buildPdfData(id: number): Promise<any> {
    const detalle = await this.getDetalleCompleto(id);
    console.log('2️⃣ DETALLE COMPLETO OBTENIDO:', detalle);
    if (!detalle)
      throw new NotFoundException(`Comprobante #${id} no encontrado`);

    return {
      id_comprobante: detalle.id_comprobante,
      serie: detalle.serie,
      numero: detalle.numero,
      tipo_comprobante: detalle.tipo_comprobante,
      fec_emision: detalle.fec_emision,
      fec_venc: detalle.fec_venc,
      estado: detalle.estado,
      subtotal: detalle.subtotal,
      igv: detalle.igv,
      total: detalle.total,
      metodo_pago: detalle.metodo_pago,

      cliente: {
        nombre: detalle.cliente.nombre,
        documento: detalle.cliente.documento,
        tipo_documento: detalle.cliente.tipo_documento,
        direccion: detalle.cliente.direccion,
        email: detalle.cliente.email,
        telefono: detalle.cliente.telefono,
      },

      responsable: {
        nombre: detalle.responsable.nombre,
        nombreSede: detalle.responsable.nombreSede,
      },

      productos: detalle.productos.map((p) => ({
        cod_prod: String(p.cod_prod),
        descripcion: p.descripcion,
        cantidad: p.cantidad,
        precio_unit: p.precio_unit,
        total: p.total,
        descuento_nombre: p.descuento_nombre,
        descuento_porcentaje: p.descuento_porcentaje,
      })),

      promocion: detalle.promocion
        ? {
            nombre: detalle.promocion.nombre,
            tipo: detalle.promocion.tipo,
            monto_descuento: detalle.promocion.monto_descuento,
            productos_afectados: undefined,
          }
        : null,

      empresaData: detalle.empresa, // <-- Lee la empresa extraída desde getDetalleCompleto
    };
  }

  async exportThermalVoucher(id: number, res: Response): Promise<void> {
    const data = await this.buildPdfData(id);
    console.log('1️⃣ DATA ANTES DE ENTRAR AL TÉRMICO:', data.empresaData);
    const buffer = await buildSalesReceiptThermalPdf(data, data.empresaData);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename=Ticket_${id}.pdf`,
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  }
}
