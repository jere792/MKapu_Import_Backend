/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Response } from 'express';
import * as nodemailer from 'nodemailer';
import { ISalesReceiptQueryPort } from '../../../domain/ports/in/sales_receipt-ports-in';
import { ISalesReceiptRepositoryPort } from '../../../domain/ports/out/sales_receipt-ports-out';
import { ICustomerRepositoryPort } from '../../../../customer/domain/ports/out/customer-port-out';
import { ListSalesReceiptFilterDto } from '../../dto/in';
import {
  SalesReceiptResponseDto,
  SalesReceiptListResponse,
  SalesReceiptKpiDto,
  SalesReceiptSummaryListDto,
  SalesReceiptSummaryItemDto,
  SalesReceiptDetalleCompletoDto,
  SaleTypeResponseDto,
  ReceiptTypeResponseDto,
} from '../../dto/out';
import { SalesReceiptMapper } from '../../mapper/sales-receipt.mapper';
import { UsersTcpProxy }     from '../../../infrastructure/adapters/out/TCP/users-tcp.proxy';
import { SedeTcpProxy }      from '../../../infrastructure/adapters/out/TCP/sede-tcp.proxy';
import { LogisticsTcpProxy } from '../../../infrastructure/adapters/out/TCP/logistics-tcp.proxy';
import {
  buildSalesReceiptPdf,
  SalesReceiptPdfData,
} from '../../../utils/sales-receipt-pdf.util';

// ── ELIMINADO: import estático que webpack no puede resolver ──────────────────
// import { getWhatsAppStatus, sendWhatsApp } from 'libs/whatsapp.util';
// Se reemplaza por require() dinámico dentro de cada método.
// ─────────────────────────────────────────────────────────────────────────────

@Injectable()
export class SalesReceiptQueryService implements ISalesReceiptQueryPort {
  constructor(
    @Inject('ISalesReceiptRepositoryPort')
    private readonly receiptRepository: ISalesReceiptRepositoryPort,

    @Inject('ICustomerRepositoryPort')
    private readonly customerRepository: ICustomerRepositoryPort,

    private readonly usersTcpProxy:     UsersTcpProxy,
    private readonly sedeTcpProxy:      SedeTcpProxy,
    private readonly logisticsTcpProxy: LogisticsTcpProxy,
  ) {}

  // ─────────────────────────────────────────────────────────────────
  //  HELPER PRIVADO — buildPdfData
  // ─────────────────────────────────────────────────────────────────
  private async buildPdfData(id: number): Promise<SalesReceiptPdfData> {
    const detalle = await this.getDetalleCompleto(id, 1);
    if (!detalle) throw new NotFoundException(`Comprobante ${id} no encontrado`);

    const tipoPromo = (detalle.promocion?.tipo ?? '').toUpperCase();

    let promoData: SalesReceiptPdfData['promocion'] = null;
    let codigosPromo: string[]                       = [];
    let porcentajePromo: number | null               = null;

    if (detalle.promocion) {
      const reglas        = detalle.promocion.reglas ?? [];
      const montoCabecera = Number(detalle.promocion.monto_descuento);
      const rawPromo: any = detalle.promocion;

      const posiblePorcentaje =
        rawPromo.valor ?? rawPromo.promo_valor ?? rawPromo.porcentaje ?? 0;

      porcentajePromo =
        tipoPromo === 'PORCENTAJE' ? Number(posiblePorcentaje) : null;

      const reglaProd = reglas.find((r: any) => {
        const tipoCond = (r as any).tipoCondicion ?? (r as any).tipo_condicion;
        return tipoCond === 'PRODUCTO';
      });

      if (reglaProd) {
        const valorCond =
          (reglaProd as any).valorCondicion ?? (reglaProd as any).valor_condicion;

        const productosAfectados = (detalle.productos ?? []).filter(
          (p: any) =>
            String(p.id_prod_ref) === String(valorCond) ||
            p.cod_prod === valorCond,
        );

        const listaAfectados = productosAfectados.map((p: any) => ({
          cod_prod:        p.cod_prod,
          descripcion:     p.descripcion,
          monto_descuento: montoCabecera,
        }));

        codigosPromo = listaAfectados.map((p) => p.cod_prod);
        promoData = {
          nombre:              detalle.promocion.nombre ?? detalle.promocion.descuento_nombre,
          tipo:                tipoPromo,
          monto_descuento:     montoCabecera,
          productos_afectados: listaAfectados,
        };
      } else {
        promoData = {
          nombre:              detalle.promocion.nombre ?? detalle.promocion.descuento_nombre,
          tipo:                tipoPromo,
          monto_descuento:     montoCabecera,
          productos_afectados: [],
        };
      }
    }

    const productos = (detalle.productos ?? []).map((p: any) => {
      const estaEnPromo = codigosPromo.includes(p.cod_prod);
      return {
        cod_prod:             p.cod_prod,
        descripcion:          p.descripcion,
        cantidad:             Number(p.cantidad),
        precio_unit:          Number(p.pre_uni ?? p.precio_unit),
        total:                Number(p.total),
        descuento_nombre:     estaEnPromo && porcentajePromo != null ? `${porcentajePromo}%` : null,
        descuento_porcentaje: estaEnPromo && porcentajePromo != null ? porcentajePromo : null,
      };
    });

    return {
      id_comprobante:   detalle.id_comprobante,
      serie:            detalle.serie,
      numero:           detalle.numero,
      tipo_comprobante: detalle.tipo_comprobante,
      fec_emision:      detalle.fec_emision,
      fec_venc:         detalle.fec_venc ?? null,
      estado:           detalle.estado,
      subtotal:         Number(detalle.subtotal),
      igv:              Number(detalle.igv),
      total:            Number(detalle.total),
      metodo_pago:      detalle.metodo_pago ?? 'N/A',
      cliente: {
        nombre:         detalle.cliente.nombre,
        documento:      detalle.cliente.documento,
        tipo_documento: detalle.cliente.tipo_documento,
        direccion:      detalle.cliente.direccion || undefined,
        email:          detalle.cliente.email     || undefined,
        telefono:       detalle.cliente.telefono  || undefined,
      },
      responsable: {
        nombre:     detalle.responsable.nombre,
        nombreSede: detalle.responsable.nombreSede,
      },
      productos,
      promocion: promoData,
    };
  }

  // ─────────────────────────────────────────────────────────────────
  //  EXPORT PDF
  // ─────────────────────────────────────────────────────────────────
  async exportPdf(id: number, res: Response): Promise<void> {
    const pdfData  = await this.buildPdfData(id);
    const buffer   = await buildSalesReceiptPdf(pdfData);
    const filename = `comprobante-${pdfData.serie}-${String(pdfData.numero).padStart(8, '0')}.pdf`;

    res.set({
      'Content-Type':        'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length':      buffer.length,
    });
    res.end(buffer);
  }

  // ─────────────────────────────────────────────────────────────────
  //  ENVIAR POR EMAIL
  // ─────────────────────────────────────────────────────────────────
  async sendByEmail(id: number): Promise<{ message: string; sentTo: string }> {
    const pdfData = await this.buildPdfData(id);
    const email   = pdfData.cliente.email;
    if (!email) throw new NotFoundException('El cliente no tiene email registrado');

    const buffer        = await buildSalesReceiptPdf(pdfData);
    const docRef        = `${pdfData.serie}-${String(pdfData.numero).padStart(8, '0')}`;
    const tipoDoc       = pdfData.tipo_comprobante.toUpperCase();
    const total         = Number(pdfData.total).toFixed(2);
    const fecEmision    = new Date(pdfData.fec_emision).toLocaleDateString('es-PE');
    const nombreCliente = pdfData.cliente.nombre;

    const transporter = nodemailer.createTransport({
      host:   process.env.MAIL_HOST ?? 'smtp.gmail.com',
      port:   Number(process.env.MAIL_PORT ?? 587),
      secure: false,
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    });

    await transporter.sendMail({
      from:    `"${process.env.COMPANY_NAME ?? 'MKapu Import'}" <${process.env.MAIL_USER}>`,
      to:      email,
      subject: `${tipoDoc} ${docRef} - ${process.env.COMPANY_NAME ?? 'MKapu Import'}`,
      html: `
        <p>Estimado/a <strong>${nombreCliente}</strong>,</p>
        <p>Gracias por su compra. Adjuntamos su comprobante de pago:</p>
        <ul>
          <li><strong>Documento:</strong> ${tipoDoc} N° ${docRef}</li>
          <li><strong>Fecha de emisión:</strong> ${fecEmision}</li>
          <li><strong>Total pagado:</strong> S/ ${total}</li>
          <li><strong>Estado:</strong> ${pdfData.estado}</li>
          ${pdfData.promocion
            ? `<li><strong>Promoción aplicada:</strong> ${pdfData.promocion.nombre} (-S/ ${Number(pdfData.promocion.monto_descuento).toFixed(2)})</li>`
            : ''}
        </ul>
        <p>Si tiene alguna consulta, no dude en contactarnos.</p>
        <br/>
        <p>Atentamente,<br/>
        <strong>${process.env.COMPANY_NAME ?? 'MKapu Import'}</strong><br/>
        ${process.env.COMPANY_PHONE ? `Tel: ${process.env.COMPANY_PHONE}<br/>` : ''}
        ${process.env.COMPANY_EMAIL ? `Email: ${process.env.COMPANY_EMAIL}<br/>` : ''}
        ${process.env.COMPANY_WEB   ? `Web: ${process.env.COMPANY_WEB}`         : ''}</p>
      `,
      attachments: [{
        filename:    `${tipoDoc}-${docRef}.pdf`,
        content:     buffer,
        contentType: 'application/pdf',
      }],
    });

    return { message: 'Email enviado correctamente', sentTo: email };
  }

  // ─────────────────────────────────────────────────────────────────
  //  ESTADO WHATSAPP
  // ─────────────────────────────────────────────────────────────────
  async whatsAppStatus(): Promise<{ ready: boolean; qr: string | null }> {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { getWhatsAppStatus } = require('libs/whatsapp.util');
    return getWhatsAppStatus();
  }

  // ─────────────────────────────────────────────────────────────────
  //  ENVIAR POR WHATSAPP
  // ─────────────────────────────────────────────────────────────────
  async sendByWhatsApp(id: number): Promise<{ message: string; sentTo: string }> {
    const pdfData  = await this.buildPdfData(id);
    const telefono = pdfData.cliente.telefono;
    if (!telefono) throw new NotFoundException('El cliente no tiene teléfono registrado');

    const buffer  = await buildSalesReceiptPdf(pdfData);
    const docRef  = `${pdfData.serie}-${String(pdfData.numero).padStart(8, '0')}`;
    const tipoDoc = pdfData.tipo_comprobante.toUpperCase();
    const total   = Number(pdfData.total).toFixed(2);
    const fecha   = new Date(pdfData.fec_emision).toLocaleDateString('es-PE');

    const mensaje = [
      `🧾 *${tipoDoc} ${docRef} - ${process.env.COMPANY_NAME ?? 'MKapu Import'}*`,
      ``,
      `Estimado/a *${pdfData.cliente.nombre}*,`,
      `Gracias por su compra. Aquí el detalle de su comprobante:`,
      ``,
      `💰 *Total pagado:* S/ ${total}`,
      `📅 *Fecha de emisión:* ${fecha}`,
      `📋 *Estado:* ${pdfData.estado}`,
      ...(pdfData.promocion
        ? [`🏷  *Promoción aplicada:* ${pdfData.promocion.nombre} (-S/ ${Number(pdfData.promocion.monto_descuento).toFixed(2)})`]
        : []),
      ``,
      `Adjuntamos el comprobante en PDF. Ante cualquier consulta, contáctenos. ✅`,
    ].join('\n');

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { sendWhatsApp } = require('libs/whatsapp.util');
    await sendWhatsApp(telefono, mensaje, buffer, `${tipoDoc}-${docRef}.pdf`);

    return { message: 'WhatsApp enviado correctamente', sentTo: telefono };
  }

  // ─────────────────────────────────────────────────────────────────
  //  MÉTODOS EXISTENTES (sin cambios)
  // ─────────────────────────────────────────────────────────────────

  async findSaleByCorrelativo(correlativo: string): Promise<any> {
    const parts = correlativo.split('-');
    if (parts.length !== 2) {
      throw new BadRequestException(
        'El formato del correlativo debe ser SERIE-NUMERO (Ej: F001-123)',
      );
    }
    const [serie, numeroStr] = parts;
    const numero = parseInt(numeroStr, 10);
    const sale   = await this.receiptRepository.findByCorrelativo(serie, numero);
    if (!sale) throw new NotFoundException(`No se encontró el comprobante ${correlativo}`);

    return {
      id:                sale.id_comprobante,
      id_sede:           sale.id_sede_ref,
      id_almacen:        (sale as any).id_almacen || 1,
      cliente_direccion: (sale as any).direccion_entrega || 'Dirección no especificada',
      cliente_ubigeo:    (sale as any).ubigeo_destino || '150101',
      detalles: sale.details.map((d) => ({
        id_producto:   d.id_prod_ref,
        cod_prod:      d.cod_prod,
        cantidad:      d.cantidad,
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
    const customer = await this.customerRepository.findByDocument(documentNumber);
    if (!customer) throw new NotFoundException(`No se encontró ningún cliente con el documento: ${documentNumber}`);
    return customer;
  }

  async listReceipts(filters?: ListSalesReceiptFilterDto): Promise<SalesReceiptListResponse> {
    const repoFilters = filters
      ? {
          estado:              filters.status,
          id_cliente:          filters.customerId,
          id_tipo_comprobante: filters.receiptTypeId,
          fec_desde:           filters.dateFrom,
          fec_hasta:           filters.dateTo,
          search:              filters.search,
        }
      : undefined;

    const receipts = await this.receiptRepository.findAll(repoFilters);
    return {
      receipts: receipts.map((r) => SalesReceiptMapper.toResponseDto(r)),
      total:    receipts.length,
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
      total:    receipts.length,
    };
  }

  async getKpiSemanal(sedeId?: number): Promise<SalesReceiptKpiDto> {
    const raw = await this.receiptRepository.getKpiSemanal(sedeId);

    const ahora     = new Date();
    const diaSemana = ahora.getDay();
    const diffLunes = diaSemana === 0 ? 6 : diaSemana - 1;

    const lunes = new Date(ahora);
    lunes.setDate(ahora.getDate() - diffLunes);
    lunes.setHours(0, 0, 0, 0);

    const domingo = new Date(lunes);
    domingo.setDate(lunes.getDate() + 6);

    return {
      total_ventas:      raw.total_ventas,
      cantidad_ventas:   raw.cantidad_ventas,
      total_boletas:     raw.total_boletas,
      total_facturas:    raw.total_facturas,
      cantidad_boletas:  raw.cantidad_boletas,
      cantidad_facturas: raw.cantidad_facturas,
      semana_desde:      lunes.toISOString().split('T')[0],
      semana_hasta:      domingo.toISOString().split('T')[0],
    };
  }

  async listReceiptsPaginated(filters: ListSalesReceiptFilterDto): Promise<SalesReceiptSummaryListDto> {
    const page  = filters.page  ?? 1;
    const limit = filters.limit ?? 10;

    const [rows, total] = await this.receiptRepository.findAllPaginated(
      {
        estado:              filters.status,
        id_cliente:          filters.customerId,
        id_tipo_comprobante: filters.receiptTypeId,
        id_metodo_pago:      filters.paymentMethodId,
        fec_desde:           filters.dateFrom,
        fec_hasta:           filters.dateTo,
        search:              filters.search,
        sedeId:              filters.sedeId,
      },
      page,
      limit,
    );

    const responsableIds = [
      ...new Set(
        rows.map((r) => Number(r.id_responsable)).filter((n) => !Number.isNaN(n) && n > 0),
      ),
    ];
    const sedeIds = [...new Set(rows.map((r) => r.id_sede).filter(Boolean))];

    const [usuarios, sedes] = await Promise.all([
      responsableIds.length > 0
        ? this.usersTcpProxy.findByIds(responsableIds)
        : Promise.resolve([]),
      Promise.all(
        sedeIds.map((id) =>
          this.sedeTcpProxy.getSedeById(id).then((s) => ({ id_sede: id, nombre: s?.nombre ?? '—' })),
        ),
      ),
    ]);

    const usuarioMap = new Map(usuarios.map((u) => [u.id_usuario, u.nombreCompleto]));
    const sedeMap    = new Map(sedes.map((s) => [s.id_sede, s.nombre]));

    const receipts: SalesReceiptSummaryItemDto[] = rows.map((r) => ({
      idComprobante:     r.id_comprobante,
      numeroCompleto:    `${r.serie}-${String(r.numero).padStart(8, '0')}`,
      serie:             r.serie,
      numero:            r.numero,
      tipoComprobante:   r.tipo_comprobante,
      fecEmision:        r.fec_emision,
      clienteNombre:     r.cliente_nombre || '—',
      clienteDocumento:  r.cliente_doc,
      idResponsable:     r.id_responsable,
      responsableNombre: usuarioMap.get(Number(r.id_responsable)) ?? '—',
      idSede:            r.id_sede,
      sedeNombre:        sedeMap.get(r.id_sede) ?? '—',
      metodoPago:        r.metodo_pago,
      total:             r.total,
      estado:            r.estado,
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
  ): Promise<SalesReceiptDetalleCompletoDto | null> {
    const HISTORIAL_LIMIT = 5;

    const raw = await this.receiptRepository.findDetalleCompleto(
      id_comprobante,
      historialPage,
      HISTORIAL_LIMIT,
    );
    if (!raw) return null;

    const { comprobante, productos, historial, historialTotal, statsCliente, promocion } = raw;

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

    const [usuarios, sedeInfo, codigoMap] = await Promise.all([
      todosIds.length > 0
        ? this.usersTcpProxy.findByIds(todosIds)
        : Promise.resolve([]),
      this.sedeTcpProxy.getSedeById(idSede),
      productIds.length > 0
        ? this.logisticsTcpProxy.getProductsCodigoByIds(productIds)
        : Promise.resolve(new Map<number, string>()),
    ]);

    const usuarioMap        = new Map(usuarios.map((u) => [u.id_usuario, u.nombreCompleto]));
    const nombreSede        = sedeInfo?.nombre ?? `Sede ${idSede}`;
    const nombreResponsable = usuarioMap.get(idResponsablePrincipal) ?? `Usuario ${idResponsablePrincipal}`;
    const nombreCliente     = comprobante.cliente_nombre?.trim() || comprobante.cliente_doc || '—';

    const totalGastadoFinal =
      comprobante.estado !== 'ANULADO'
        ? statsCliente.total_gastado
        : statsCliente.total_gastado - Number(comprobante.total);

    const cantidadComprasFinal =
      comprobante.estado !== 'ANULADO'
        ? statsCliente.cantidad_compras
        : statsCliente.cantidad_compras - 1;

    return {
      id_comprobante:   Number(comprobante.id_comprobante),
      numero_completo:  `${comprobante.serie}-${String(comprobante.numero).padStart(8, '0')}`,
      serie:            comprobante.serie,
      numero:           Number(comprobante.numero),
      tipo_comprobante: comprobante.tipo_comprobante ?? '—',
      fec_emision:      comprobante.fec_emision,
      fec_venc:         comprobante.fec_venc ?? null,
      estado:           comprobante.estado,
      subtotal:         Number(comprobante.subtotal),
      igv:              Number(comprobante.igv),
      total:            Number(comprobante.total),
      metodo_pago:      comprobante.metodo_pago,

      cliente: {
        id_cliente:            comprobante.cliente_id,
        nombre:                nombreCliente,
        documento:             comprobante.cliente_doc,
        tipo_documento:        comprobante.cliente_tipo_doc ?? '—',
        direccion:             comprobante.cliente_direccion ?? '',
        email:                 comprobante.cliente_email    ?? '',
        telefono:              comprobante.cliente_telefono ?? '',
        total_gastado_cliente: totalGastadoFinal,
        cantidad_compras:      cantidadComprasFinal,
      },

      productos: (productos as any[]).map((p) => {
        const codigoReal     = codigoMap.get(Number(p.id_prod_ref));
        const montoPromo     = p.descuento_promo_monto != null ? Number(p.descuento_promo_monto) : null;
        const baseItemSinIgv = Number(
          (Number(p.cantidad) * Number(p.precio_unit)).toFixed(2),
        );
        return {
          id_prod_ref:                p.id_prod_ref,
          cod_prod:                   codigoReal ?? p.cod_prod ?? p.id_prod_ref,
          descripcion:                p.descripcion,
          cantidad:                   Number(p.cantidad),
          precio_unit:                Number(p.precio_unit),
          igv:                        Number(p.igv),
          total:                      Number(p.total),
          descuento_nombre:           p.descuento_nombre || null,
          descuento_porcentaje:       Number(p.descuento_porcentaje) || null,
          promocion_aplicada:         Boolean(p.promocion_aplicada),
          descuento_promo_monto:      montoPromo,
          descuento_promo_porcentaje:
            montoPromo != null && baseItemSinIgv > 0
              ? Number(((montoPromo / baseItemSinIgv) * 100).toFixed(2))
              : null,
        };
      }),

      responsable: {
        id:         comprobante.id_responsable,
        nombre:     nombreResponsable,
        sede:       idSede,
        nombreSede,
      },

      promocion: promocion
        ? {
            id:                   promocion.id,
            codigo:               promocion.codigo,
            nombre:               promocion.nombre,
            tipo:                 promocion.tipo,
            monto_descuento:      promocion.monto_descuento,
            descuento_nombre:     promocion.descuento_nombre,
            descuento_porcentaje: promocion.descuento_porcentaje,
            reglas:               promocion.reglas ?? [],
            productosIds:         promocion.productosIds ?? [],
          }
        : null,

      historial_cliente: (historial as any[]).map((h) => ({
        id_comprobante:  Number(h.id_comprobante),
        numero_completo: `${h.serie}-${String(h.numero).padStart(8, '0')}`,
        fec_emision:     h.fec_emision,
        total:           Number(h.total),
        estado:          h.estado,
        metodo_pago:     h.metodo_pago,
        responsable:     usuarioMap.get(Number(h.id_responsable)) ?? '—',
      })),

      historial_pagination: {
        total:       historialTotal,
        page:        historialPage,
        limit:       HISTORIAL_LIMIT,
        total_pages: Math.ceil(historialTotal / HISTORIAL_LIMIT),
      },
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
}