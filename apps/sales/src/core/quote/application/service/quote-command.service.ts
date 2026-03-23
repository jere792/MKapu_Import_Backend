/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { IQuoteCommandPort } from '../../domain/ports/in/quote-ports-in';
import { IQuoteRepositoryPort } from '../../domain/ports/out/quote-ports-out';
import { ICustomerRepositoryPort } from '../../../customer/domain/ports/out/customer-port-out';
import { ISedeProxy } from '../../domain/ports/out/sede-proxy.port';
import { CreateQuoteDto } from '../dto/in/create-quote.dto';
import { QuoteResponseDto } from '../dto/out/quote-response.dto';
import { QuoteMapper } from '../mapper/quote.mapper';
import { Quote, QuoteStatus } from '../../domain/entity/quote-domain-entity';
import { QuoteDetail } from '../../domain/entity/quote-datail-domain-entity';
import { ProductStockTcpProxy } from '../../infrastructure/adapters/out/TCP/ProductStockTcpProxy';
import { ISupplierProxy } from '../../domain/ports/out/supplier-proxy.port';
import { EmpresaTcpProxy } from '../../../sales-receipt/infrastructure/adapters/out/TCP/empresa-tcp.proxy';

const ESTADOS_VALIDOS = ['PENDIENTE', 'APROBADA', 'RECHAZADA'];

@Injectable()
export class QuoteCommandService implements IQuoteCommandPort {
  constructor(
    @Inject('IQuoteRepositoryPort')
    private readonly repository: IQuoteRepositoryPort,
    @Inject('ICustomerRepositoryPort')
    private readonly customerRepository: ICustomerRepositoryPort,
    @Inject(ProductStockTcpProxy)
    private readonly productStockProxy: ProductStockTcpProxy,
    @Inject('ISedeProxy')
    private readonly sedeProxy: ISedeProxy,
    private readonly eventEmitter: EventEmitter2,
    @Inject('ISupplierProxy')
    private readonly supplierProxy: ISupplierProxy,
    @Inject('IEmpresaProxy')
    private readonly empresaProxy: EmpresaTcpProxy,
  ) {}

  async create(dto: CreateQuoteDto): Promise<QuoteResponseDto> {
    const tipo = dto.tipo ?? 'VENTA';
    let customer = null;
    let proveedor = null;

    if (tipo === 'VENTA') {
      if (!dto.documento_cliente)
        throw new BadRequestException(
          'documento_cliente es requerido para cotizaciones de VENTA',
        );
      customer = await this.customerRepository.findByDocument(
        dto.documento_cliente,
      );
      if (!customer)
        throw new NotFoundException(
          `Cliente ${dto.documento_cliente} no encontrado`,
        );
    }

    if (tipo === 'COMPRA') {
      if (!dto.id_proveedor)
        throw new BadRequestException(
          'id_proveedor es requerido para cotizaciones de COMPRA',
        );

      proveedor = await this.supplierProxy.getSupplierById(
        Number(dto.id_proveedor),
      );
      if (!proveedor)
        throw new NotFoundException(
          `Proveedor ${dto.id_proveedor} no encontrado`,
        );
    }

    // 👇 Solicitamos la sede y la empresa en paralelo para optimizar tiempo
    const [sede, empresa] = await Promise.all([
      this.sedeProxy.getSedeById(dto.id_sede),
      this.empresaProxy.getEmpresaActiva(),
    ]);

    if (!sede) throw new NotFoundException(`Sede ${dto.id_sede} no encontrada`);

    if (dto.subtotal + dto.igv !== dto.total)
      throw new BadRequestException('subtotal + igv debe ser igual al total');

    const details = dto.detalles.map(
      (det) =>
        new QuoteDetail(
          null,
          0,
          det.id_prod_ref,
          det.cod_prod,
          det.descripcion,
          det.cantidad,
          det.precio,
        ),
    );

   const domain = new Quote(
    null,
    customer?.id_cliente ?? null,
    dto.id_proveedor ?? null,
    dto.id_sede,
    dto.subtotal,
    dto.igv,
    dto.total,
    'PENDIENTE',
    new Date(),
    new Date(dto.fec_venc),
    true,
    details,
    tipo,
    dto.id_responsable_ref ?? null,   
  );

    const saved = await this.repository.save(domain);

    this.eventEmitter.emit('quote.created', {
      id_cotizacion: saved.id_cotizacion,
      id_cliente: saved.id_cliente,
      id_proveedor: saved.id_proveedor,
      tipo: saved.tipo,
    });

    // 👇 Pasamos los 5 argumentos requeridos por el mapper actual
    return QuoteMapper.toResponseDto(saved, customer, sede, proveedor, empresa);
  }

  async approve(id: number): Promise<QuoteResponseDto> {
    const domain = await this.repository.findById(id);
    if (!domain) throw new NotFoundException(`Cotización ${id} no encontrada`);

    // 👇 Consulta concurrente de las entidades relacionadas
    const [customer, sede, empresa, proveedor] = await Promise.all([
      domain.id_cliente
        ? this.customerRepository.findById(domain.id_cliente)
        : Promise.resolve(null),
      this.sedeProxy.getSedeById(domain.id_sede),
      this.empresaProxy.getEmpresaActiva(),
      domain.id_proveedor
        ? this.supplierProxy.getSupplierById(Number(domain.id_proveedor))
        : Promise.resolve(null),
    ]);

    domain.aprobar();
    const updated = await this.repository.update(domain);

    this.eventEmitter.emit('quote.approved', {
      id_cotizacion: updated.id_cotizacion,
      total: updated.total,
    });

    // 👇 Pasamos los 5 argumentos requeridos por el mapper actual
    return QuoteMapper.toResponseDto(
      updated,
      customer,
      sede,
      proveedor,
      empresa,
    );
  }

  // ── Cambiar estado (RECHAZADA | APROBADA | PENDIENTE) ────────────────────
  async changeStatus(id: number, estado: string): Promise<QuoteResponseDto> {
    const estadoUpper = estado?.toUpperCase();

    if (!ESTADOS_VALIDOS.includes(estadoUpper)) {
      throw new BadRequestException(
        `Estado inválido: ${estado}. Valores permitidos: ${ESTADOS_VALIDOS.join(', ')}`,
      );
    }

    const domain = await this.repository.findById(id);
    if (!domain) throw new NotFoundException(`Cotización ${id} no encontrada`);

    // 👇 Consulta concurrente de las entidades relacionadas
    const [customer, sede, empresa, proveedor] = await Promise.all([
      domain.id_cliente
        ? this.customerRepository.findById(domain.id_cliente)
        : Promise.resolve(null),
      this.sedeProxy.getSedeById(domain.id_sede),
      this.empresaProxy.getEmpresaActiva(),
      domain.id_proveedor
        ? this.supplierProxy.getSupplierById(Number(domain.id_proveedor))
        : Promise.resolve(null),
    ]);

    domain.cambiarEstado(estadoUpper as QuoteStatus);
    const updated = await this.repository.update(domain);

    this.eventEmitter.emit('quote.status_changed', {
      id_cotizacion: updated.id_cotizacion,
      estado: updated.estado,
    });

    // 👇 Pasamos los 5 argumentos requeridos por el mapper actual
    return QuoteMapper.toResponseDto(
      updated,
      customer,
      sede,
      proveedor,
      empresa,
    );
  }

  // ── Eliminar permanentemente ──────────────────────────────────────────────
  async delete(id: number): Promise<void> {
    const domain = await this.repository.findById(id);
    if (!domain) throw new NotFoundException(`Cotización ${id} no encontrada`);
    await this.repository.delete(id);
    this.eventEmitter.emit('quote.deleted', { id_cotizacion: id });
  }
}
