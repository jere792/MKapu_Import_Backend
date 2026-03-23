import { Injectable, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, timeout, catchError, of } from 'rxjs';
import { DispatchMapper } from '../mapper/dispatch.mapper';
import { DispatchOutputDto } from '../dto/out/dispatch-output.dto';
import { IDispatchOutputPort, FindAllFilters } from '../../domain/ports/out/dispatch-output.port';

// ── DTOs del receipt (lo que devuelve sales) ─────────────────────────
export interface ReceiptDetalleCliente {
  nombre:       string;
  documento:    string;
  tipo_documento?: string;
  telefono:     string;
  direccion:    string;
}
export interface ReceiptDetalleProducto {
  id_prod_ref:  number;
  cod_prod:     string;
  descripcion:  string;
  cantidad:     number;
  pre_uni:      number;
  total:        number;
}
export interface ReceiptDetalle {
  id_comprobante: number;
  numero_completo: string;
  serie:          string;
  numero:         number;
  tipo_comprobante: string;
  fec_emision:    string;
  subtotal:       number;
  igv:            number;
  total:          number;
  descuento?:     number;
  metodo_pago:    string;
  cliente:        ReceiptDetalleCliente;
  responsable:    { nombre: string; sede: number; nombreSede: string };
  productos:      ReceiptDetalleProducto[];
}

// ── DTO enriquecido que devuelve el endpoint ─────────────────────────
export interface EnrichedDispatchDto extends DispatchOutputDto {
  comprobante?:   string;
  tipoComprobante?: string;
  fechaEmision?:  string;
  subtotal?:      number;
  igv?:           number;
  total?:         number;
  descuento?:     number;
  metodoPago?:    string;
  clienteNombre?: string;
  clienteDoc?:    string;
  clienteTelefono?: string;
  clienteDireccion?: string;
  sedeNombre?:    string;
  responsableNombre?: string;
  productosDetalle?: {
    id_prod_ref:  number;
    cod_prod:     string;
    descripcion:  string;
    cantidad:     number;
    precio_unit:  number;
    total:        number;
  }[];
}

export interface DispatchPageResult {
  data:       EnrichedDispatchDto[];
  total:      number;
  page:       number;
  limit:      number;
  totalPages: number;
}

export interface IDispatchQueryPort {
  findById(id_despacho: number): Promise<DispatchOutputDto>;
  findAll(filters?: FindAllFilters): Promise<DispatchPageResult>;
  findByVenta(id_venta_ref: number): Promise<DispatchOutputDto[]>;
}

@Injectable()
export class DispatchQueryService implements IDispatchQueryPort {
  constructor(
    @Inject('IDispatchOutputPort')
    private readonly repository: IDispatchOutputPort,
    @Inject('SALES_TCP_CLIENT')
    private readonly salesClient: ClientProxy,
  ) {}

  async findById(id_despacho: number): Promise<DispatchOutputDto> {
    const dispatch = await this.repository.findById(id_despacho);
    if (!dispatch) throw new Error(`Despacho ${id_despacho} no encontrado`);
    return DispatchMapper.toOutputDto(dispatch);
  }

  async findAll(filters?: FindAllFilters): Promise<DispatchPageResult> {
    const page  = filters?.page  ?? 1;
    const limit = filters?.limit ?? 10;

    const { data, total } = await this.repository.findAll(filters);
    const dtos = data.map(DispatchMapper.toOutputDto);

    // ── Obtener recibos de Sales por TCP en paralelo ───────────────
    const idVentasUnicas = [...new Set(dtos.map(d => d.id_venta_ref).filter(Boolean))];
    const receiptMap = new Map<number, ReceiptDetalle>();

    // Promise.allSettled → nunca explota aunque falle el TCP
    const results = await Promise.allSettled(
      idVentasUnicas.map(id =>
        firstValueFrom<{ success: boolean; data: ReceiptDetalle }>(
          this.salesClient
            .send({ cmd: 'get_receipt_detalle' }, id)
            .pipe(
              timeout(4000),
              catchError(() => of({ success: false, data: null } as any)),
            ),
        ),
      ),
    );

    results.forEach((result, idx) => {
      if (result.status === 'fulfilled' && result.value?.success && result.value.data) {
        receiptMap.set(idVentasUnicas[idx], result.value.data);
      }
    });

    // ── Enriquecer cada despacho con datos del receipt ─────────────
    const enriched: EnrichedDispatchDto[] = dtos.map(dto => {
      const receipt = receiptMap.get(dto.id_venta_ref);
      if (!receipt) return dto;

      return {
        ...dto,
        comprobante:        receipt.numero_completo,
        tipoComprobante:    receipt.tipo_comprobante,
        fechaEmision:       receipt.fec_emision,
        subtotal:           Number(receipt.subtotal),
        igv:                Number(receipt.igv),
        total:              Number(receipt.total),
        descuento:          Number(receipt.descuento ?? 0),
        metodoPago:         receipt.metodo_pago,
        clienteNombre:      receipt.cliente?.nombre,
        clienteDoc:         receipt.cliente?.documento,
        clienteTelefono:    receipt.cliente?.telefono,
        clienteDireccion:   receipt.cliente?.direccion,
        sedeNombre:         receipt.responsable?.nombreSede,
        responsableNombre:  receipt.responsable?.nombre,
        productosDetalle:   (receipt.productos ?? []).map(p => ({
          id_prod_ref:  p.id_prod_ref,
          cod_prod:     p.cod_prod,
          descripcion:  p.descripcion,
          cantidad:     Number(p.cantidad),
          precio_unit:  Number(p.pre_uni),
          total:        Number(p.total),
        })),
      };
    });

    return { data: enriched, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findByVenta(id_venta_ref: number): Promise<DispatchOutputDto[]> {
    const dispatches = await this.repository.findByVenta(id_venta_ref);
    return dispatches.map(DispatchMapper.toOutputDto);
  }
}