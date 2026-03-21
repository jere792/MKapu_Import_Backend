import { Quote, QuoteStatus, QuoteTipo } from "../../domain/entity/quote-domain-entity";
import { QuoteOrmEntity } from "../../infrastructure/entity/quote-orm.entity";
import { QuoteDetailOrmEntity } from "../../infrastructure/entity/quote-orm-detail.entity";
import { QuoteResponseDto, QuoteListItemDto } from "../dto/out/quote-response.dto";
import { QuoteDetail } from '../../domain/entity/quote-datail-domain-entity';

export class QuoteMapper {

  static toOrmEntity(domain: Quote): QuoteOrmEntity {
    const orm        = new QuoteOrmEntity();
    orm.id_cliente   = domain.id_cliente;
    orm.id_proveedor = domain.id_proveedor;
    orm.id_sede      = domain.id_sede;
    orm.tipo         = domain.tipo;
    orm.subtotal     = domain.subtotal;
    orm.igv          = domain.igv;
    orm.total        = domain.total;
    orm.estado       = domain.estado;
    orm.fec_emision  = domain.fec_emision;
    orm.fec_venc     = domain.fec_venc;
    orm.activo       = domain.activo;
    orm.detalles     = domain.details.map(detail => {
      const detOrm       = new QuoteDetailOrmEntity();
      detOrm.id_detalle  = detail.id_detalle ?? undefined;
      detOrm.id_prod_ref = detail.id_prod_ref;
      detOrm.cod_prod    = detail.cod_prod;
      detOrm.descripcion = detail.descripcion;
      detOrm.cantidad    = detail.cantidad;
      detOrm.precio      = detail.precio;
      return detOrm;
    });
    return orm;
  }

  static toDomain(orm: QuoteOrmEntity): Quote {
    return new Quote(
      orm.id_cotizacion,
      orm.id_cliente   ?? null,
      orm.id_proveedor ?? null,
      orm.id_sede,
      Number(orm.subtotal),
      Number(orm.igv),
      Number(orm.total),
      orm.estado as QuoteStatus,
      orm.fec_emision,
      orm.fec_venc,
      orm.activo,
      (orm.detalles ?? []).map(det =>
        new QuoteDetail(
          det.id_detalle,
          orm.id_cotizacion,
          det.id_prod_ref,
          det.cod_prod,
          det.descripcion,
          det.cantidad,
          det.precio,
        )
      ),
      (orm.tipo ?? 'VENTA') as QuoteTipo,
    );
  }

  static toListItemDto(
    domain: Quote,
    sede_nombre: string,
    participante_nombre: string,
    proveedor_nombre?: string,   
  ): QuoteListItemDto {
    return {
      id_cotizacion:    domain.id_cotizacion!,
      codigo:           `COT-${String(domain.id_cotizacion).padStart(4, '0')}`,
      cliente_nombre:   participante_nombre,
      proveedor_nombre: proveedor_nombre ?? undefined,
      id_proveedor:     domain.id_proveedor ? Number(domain.id_proveedor) : undefined,
      fec_emision:      domain.fec_emision.toISOString(),
      fec_venc:         domain.fec_venc.toISOString(),
      id_sede:          domain.id_sede,
      sede_nombre,
      estado:           domain.estado,
      tipo:             domain.tipo,
      total:            domain.total,
      activo:           domain.activo,
    };
  }

  static toResponseDto(
    domain: Quote,
    cliente: any | null,
    sede: any,
    proveedor: any | null = null,
  ): QuoteResponseDto {
    return {
      id_cotizacion: domain.id_cotizacion!,
      id_cliente:    domain.id_cliente,
      id_proveedor:  domain.id_proveedor,
      tipo:          domain.tipo,
      cliente: cliente ? {
        nombre_cliente:    cliente?.nombres,
        apellidos_cliente: cliente?.apellidos,
        direccion:         cliente?.direccion,
        razon_social:      cliente?.razon_social,
        email:             cliente?.email,
        telefono:          cliente?.telefono,
        id_tipo_documento: cliente?.id_tipo_documento,
        valor_doc:         cliente?.valor_doc,
      } : null,
      proveedor: proveedor ? {
        id:           proveedor?.id,
        razon_social: proveedor?.razon_social,
        ruc:          proveedor?.ruc,
        contacto:     proveedor?.contacto,
        email:        proveedor?.email,
        telefono:     proveedor?.telefono,
      } : null,
      id_sede: domain.id_sede,
      sede: {
        nombre_sede:  sede?.nombre,
        codigo:       sede?.codigo,
        ciudad:       sede?.ciudad,
        departamento: sede?.departamento,
        direccion:    sede?.direccion,
        telefono:     sede?.telefono,
      },
      fec_emision: domain.fec_emision.toISOString(),
      fec_venc:    domain.fec_venc.toISOString(),
      subtotal:    domain.subtotal,
      igv:         domain.igv,
      total:       domain.total,
      estado:      domain.estado,
      activo:      domain.activo,
      detalles: domain.details.map(detail => ({
        id_detalle:  detail.id_detalle!,
        id_prod_ref: detail.id_prod_ref,
        cod_prod:    detail.cod_prod,
        descripcion: detail.descripcion,
        cantidad:    detail.cantidad,
        precio:      detail.precio,
        importe:     detail.cantidad * detail.precio,
      })),
    };
  }
}