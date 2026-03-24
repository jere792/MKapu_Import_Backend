import { BadRequestException, Injectable, Inject, NotFoundException } from '@nestjs/common';
import { Response } from 'express';
import { IQuoteQueryPort } from '../../domain/ports/in/quote-ports-in';
import { IQuoteRepositoryPort } from '../../domain/ports/out/quote-ports-out';
import { ICustomerRepositoryPort } from '../../../customer/domain/ports/out/customer-port-out';
import { ISedeProxy } from '../../domain/ports/out/sede-proxy.port';
import {
  QuoteResponseDto,
  QuotePagedResponseDto,
} from '../dto/out/quote-response.dto';
import { EmployeeQuotesListResponseDto } from '../dto/out/employee-quotes-list-response.dto';
import { QuoteMapper } from '../mapper/quote.mapper';
import { QuoteQueryFiltersDto } from '../dto/in/quote-query-filters.dto';
import { ListEmployeeQuotesFilterDto } from '../dto/in/list-employee-quotes-filter.dto';
import * as nodemailer from 'nodemailer';
import { buildQuotePdf } from '../../utils/quote-pdf.util';
import { getWhatsAppStatus, sendWhatsApp } from 'libs/whatsapp.util';
import { buildThermalPdf } from '../../utils/quote-thermal.util';
import { ISupplierProxy } from '../../domain/ports/out/supplier-proxy.port';
import { EmpresaTcpProxy } from '../../../sales-receipt/infrastructure/adapters/out/TCP/empresa-tcp.proxy';
import { UsersTcpProxy } from '../../../sales-receipt/infrastructure/adapters/out/TCP/users-tcp.proxy'; // â† nuevo

@Injectable()
export class QuoteQueryService implements IQuoteQueryPort {
  constructor(
    @Inject('IQuoteRepositoryPort')
    private readonly repository: IQuoteRepositoryPort,
    @Inject('ICustomerRepositoryPort')
    private readonly customerRepository: ICustomerRepositoryPort,
    @Inject('ISedeProxy')
    private readonly sedeProxy: ISedeProxy,
    @Inject('ISupplierProxy')
    private readonly supplierProxy: ISupplierProxy,
    @Inject('IEmpresaProxy')
    private readonly empresaProxy: EmpresaTcpProxy,
    private readonly usersTcpProxy: UsersTcpProxy,  
  ) {}

  async getById(id: number): Promise<QuoteResponseDto | null> {
    const quote = await this.repository.findById(id);
    if (!quote) return null;

    const [customer, sede, empresa, proveedor] = await Promise.all([
      quote.id_cliente
        ? this.customerRepository.findById(quote.id_cliente)
        : Promise.resolve(null),
      this.sedeProxy.getSedeById(quote.id_sede),
      this.empresaProxy.getEmpresaActiva(),
      quote.id_proveedor
        ? this.supplierProxy.getSupplierById(Number(quote.id_proveedor))
        : Promise.resolve(null),
    ]);

    return QuoteMapper.toResponseDto(quote, customer, sede, proveedor, empresa);
  }

  async getByCustomerDocument(valor_doc: string): Promise<QuoteResponseDto[]> {
    const customer = await this.customerRepository.findByDocument(valor_doc);
    if (!customer) return [];

    const quotes = await this.repository.findByCustomerId(customer.id_cliente);
    const empresa = await this.empresaProxy.getEmpresaActiva();

    return Promise.all(
      quotes.map(async (quote) => {
        const [sede, proveedor] = await Promise.all([
          this.sedeProxy.getSedeById(quote.id_sede),
          quote.id_proveedor
            ? this.supplierProxy.getSupplierById(Number(quote.id_proveedor))
            : Promise.resolve(null),
        ]);
        return QuoteMapper.toResponseDto(quote, customer, sede, proveedor, empresa);
      }),
    );
  }

  async findAllPaged(filters: QuoteQueryFiltersDto): Promise<QuotePagedResponseDto> {
    const { data, total } = await this.repository.findAllPaged(filters);
    const page  = Number(filters.page)  || 1;
    const limit = Number(filters.limit) || 10;

    const sedeIds      = [...new Set(data.map((q) => q.id_sede))];
    const clienteIds   = [...new Set(data.filter((q) => q.id_cliente).map((q) => q.id_cliente))];
    const proveedorIds = [...new Set(
      data.filter((q) => q.tipo === 'COMPRA' && q.id_proveedor)
          .map((q) => Number(q.id_proveedor)),
    )];

    // â”€â”€ IDs de responsables Ãºnicos â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const responsableIds = [
      ...new Set(
        data
          .filter((q) => q.id_responsable_ref)
          .map((q) => Number(q.id_responsable_ref)),
      ),
    ];

    const [sedes, clientes, proveedores, usuarios] = await Promise.all([
      Promise.all(sedeIds.map((id) =>
        this.sedeProxy.getSedeById(id).then((s) => ({ id, data: s })),
      )),
      Promise.all(clienteIds.map((id) =>
        this.customerRepository.findById(id).then((c) => ({ id, data: c })),
      )),
      Promise.all(proveedorIds.map((id) =>
        this.supplierProxy.getSupplierById(id).then((p) => ({ id, data: p })),
      )),
      // â”€â”€ ResoluciÃ³n de nombres de responsables via TCP â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
      responsableIds.length > 0
        ? this.usersTcpProxy.findByIds(responsableIds).catch(() => [])
        : Promise.resolve([]),
    ]);

    const sedeMap        = new Map(sedes.map((s) => [s.id, s.data]));
    const clienteMap     = new Map(clientes.map((c) => [c.id, c.data]));
    const proveedorMap   = new Map(proveedores.map((p) => [p.id, p.data]));
    // â”€â”€ Mapa id_usuario â†’ nombreCompleto â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const usuarioMap     = new Map(
      (usuarios as Array<{ id_usuario: number; nombreCompleto: string }>)
        .map((u) => [String(u.id_usuario), u.nombreCompleto]),
    );

    const mapped = data.map((quote) => {
      const sede    = sedeMap.get(quote.id_sede);
      const cliente = clienteMap.get(quote.id_cliente);

      let participante_nombre: string;
      if (quote.tipo === 'COMPRA') {
        const provNombreRepo = (quote as any).proveedor_nombre as string | null;
        const prov           = proveedorMap.get(Number(quote.id_proveedor));
        participante_nombre  =
          provNombreRepo || prov?.razon_social || `Proveedor #${quote.id_proveedor}`;
      } else {
        participante_nombre =
          cliente?.razon_social ||
          `${cliente?.nombres ?? ''} ${cliente?.apellidos ?? ''}`.trim() ||
          'â€”';
      }

      // â”€â”€ Resolver nombre del responsable â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
      const nombre_responsable = quote.id_responsable_ref
        ? (usuarioMap.get(String(quote.id_responsable_ref)) ?? `#${quote.id_responsable_ref}`)
        : null;

      return QuoteMapper.toListItemDto(
        quote,
        sede?.nombre ?? '',
        participante_nombre,
        undefined,
        nombre_responsable,  
      );
    });

    const kpiAprobadas  = mapped.filter((q) => q.estado === 'APROBADA').length;
    const kpiPendientes = mapped.filter((q) => q.estado === 'PENDIENTE').length;

    return {
      data: mapped,
      total,
      page,
      limit,
      totalPages:    Math.ceil(total / limit),
      kpiTotal:      total,
      kpiAprobadas,
      kpiPendientes,
    };
  }

  // â”€â”€ resto de mÃ©todos sin cambios â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  async listEmployeeQuotes(
    filters: ListEmployeeQuotesFilterDto,
  ): Promise<EmployeeQuotesListResponseDto> {
    const page = Math.max(filters.page ?? 1, 1);
    const limit = Math.min(Math.max(filters.limit ?? 10, 1), 100);
    const dateFrom = parseDateStart(filters.dateFrom);
    const dateTo = parseDateEnd(filters.dateTo);

    if (dateFrom && dateTo && dateFrom > dateTo) {
      throw new BadRequestException(
        'La fecha de inicio no puede ser mayor que la fecha de fin',
      );
    }

    const [rows, totalCotizaciones] =
      await this.repository.findEmployeeQuotesPaginated(
        {
          userId: filters.userId,
          dateFrom,
          dateTo,
        },
        page,
        limit,
      );

    return {
      cotizaciones: rows.map((row) => ({
        codigo: `COT-${String(row.id_cotizacion).padStart(4, '0')}`,
        cliente: row.cliente_nombre,
        fecha: row.fec_emision,
        total: Number(row.total),
        estado: row.estado,
      })),
      totalCotizaciones,
      page,
      limit,
      totalPages: Math.ceil(totalCotizaciones / limit),
    };
  }

  async exportThermalVoucher(id: number, res: Response): Promise<void> {
    const quote = await this.getById(id);
    if (!quote) throw new NotFoundException(`CotizaciÃ³n ${id} no encontrada`);
    const buffer = await buildThermalPdf(quote);
    res.set({
      'Content-Type':        'application/pdf',
      'Content-Disposition': `inline; filename=Ticket_COT-${id}.pdf`,
      'Content-Length':      buffer.length,
    });
    res.end(buffer);
  }

  private async buildPdfBuffer(id: number): Promise<{ buffer: Buffer; quote: QuoteResponseDto }> {
    const quote = await this.getById(id);
    if (!quote) throw new NotFoundException(`CotizaciÃ³n ${id} no encontrada`);
    const buffer = await buildQuotePdf(quote);
    return { buffer, quote };
  }

  async exportPdf(id: number, res: Response): Promise<void> {
    const { buffer, quote } = await this.buildPdfBuffer(id);
    const codigo = (quote as any).codigo ?? `COT-${quote.id_cotizacion}`;
    res.set({
      'Content-Type':        'application/pdf',
      'Content-Disposition': `attachment; filename=Cotizacion_${codigo}.pdf`,
      'Content-Length':      buffer.length,
    });
    res.end(buffer);
  }

  async sendByEmail(id: number): Promise<{ message: string; sentTo: string }> {
    const { buffer, quote } = await this.buildPdfBuffer(id);
    const email = quote.cliente?.email;
    if (!email) throw new NotFoundException('El cliente no tiene email registrado');

    const codigo = (quote as any).codigo ?? `COT-${quote.id_cotizacion}`;
    const nombre =
      quote.cliente?.razon_social ||
      `${quote.cliente?.nombre_cliente ?? ''} ${quote.cliente?.apellidos_cliente ?? ''}`.trim() ||
      'Cliente';

    const transporter = nodemailer.createTransport({
      host:   process.env.MAIL_HOST ?? 'smtp.gmail.com',
      port:   Number(process.env.MAIL_PORT ?? 587),
      secure: false,
      auth:   { user: process.env.MAIL_USER, pass: process.env.MAIL_PASS },
    });

    await transporter.sendMail({
      from:    `"MKapu Import" <${process.env.MAIL_USER}>`,
      to:      email,
      subject: `CotizaciÃ³n ${codigo} - MKapu Import`,
      html: `
        <p>Estimado/a <strong>${nombre}</strong>,</p>
        <p>Adjuntamos la cotizaciÃ³n <strong>${codigo}</strong> para su revisiÃ³n.</p>
        <p>Ante cualquier consulta, no dude en contactarnos.</p>
        <br/>
        <p>Atentamente,<br/><strong>MKapu Import</strong></p>
      `,
      attachments: [{
        filename:    `Cotizacion_${codigo}.pdf`,
        content:     buffer,
        contentType: 'application/pdf',
      }],
    });

    return { message: 'Email enviado correctamente', sentTo: email };
  }

  async whatsAppStatus(): Promise<{ ready: boolean; qr: string | null }> {
    return getWhatsAppStatus();
  }

  async sendByWhatsApp(id: number): Promise<{ message: string; sentTo: string }> {
    const { buffer, quote } = await this.buildPdfBuffer(id);
    const telefono = quote.cliente?.telefono;
    if (!telefono) throw new NotFoundException('El cliente no tiene telÃ©fono registrado');

    const codigo = (quote as any).codigo ?? `COT-${quote.id_cotizacion}`;
    const nombre =
      quote.cliente?.razon_social ||
      `${quote.cliente?.nombre_cliente ?? ''} ${quote.cliente?.apellidos_cliente ?? ''}`.trim() ||
      'Cliente';

    const mensaje = [
      `ðŸ“‹ *CotizaciÃ³n ${codigo} - MKapu Import*`,
      ``,
      `Estimado/a *${nombre}*,`,
      `Le enviamos su cotizaciÃ³n adjunta con el siguiente resumen:`,
      ``,
      `ðŸ’° *Total:* S/. ${Number(quote.total).toFixed(2)}`,
      `ðŸ“… *VÃ¡lido hasta:* ${new Date(quote.fec_venc).toLocaleDateString('es-PE')}`,
      ``,
      `Ante cualquier consulta, no dude en contactarnos. âœ…`,
    ].join('\n');

    await sendWhatsApp(telefono, mensaje, buffer, `Cotizacion_${codigo}.pdf`);
    return { message: 'WhatsApp enviado correctamente', sentTo: telefono };
  }
}
function parseDateStart(value?: string): Date | undefined {
  if (!value) {
    return undefined;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new BadRequestException('Fecha de inicio invalida');
  }

  date.setHours(0, 0, 0, 0);
  return date;
}

function parseDateEnd(value?: string): Date | undefined {
  if (!value) {
    return undefined;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new BadRequestException('Fecha de fin invalida');
  }

  date.setHours(23, 59, 59, 999);
  return date;
}

