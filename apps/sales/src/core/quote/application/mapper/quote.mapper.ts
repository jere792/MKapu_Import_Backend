import { Quote } from "../../domain/entity/quote-domain-entity";
import { QuoteOrmEntity } from "../../infrastructure/entity/quote-orm.entity";
import { QuoteResponseDto } from "../dto/out/quote-response.dto";

export class QuoteMapper {
  /**
   * Convierte de Entidad de Dominio a Entidad de Base de Datos (ORM)
   */
  static toOrmEntity(domain: Quote): QuoteOrmEntity {
    const orm = new QuoteOrmEntity();
    // Si id_cotizacion es null, TypeORM lo tratará como auto_increment
    if (domain.id_cotizacion) orm.id_cotizacion = domain.id_cotizacion;
    
    orm.id_cliente = domain.id_cliente;
    orm.fec_emision = domain.fec_emision;
    orm.fec_venc = domain.fec_venc;
    orm.subtotal = domain.subtotal;
    orm.igv = domain.igv;
    orm.total = domain.total;
    orm.estado = domain.estado;
    orm.activo = domain.activo;
    
    return orm;
  }

  /**
   * Convierte de ORM a Entidad de Dominio (Rehidratación)
   * Esto asegura que el objeto tenga los métodos como .aprobar() o .estaVencida()
   */
  static toDomain(orm: QuoteOrmEntity): Quote {
    return new Quote(
      orm.id_cotizacion,
      orm.id_cliente,
      Number(orm.subtotal), // Forzamos number ya que decimal en DB a veces viene como string
      Number(orm.igv),
      Number(orm.total),
      orm.estado as any,
      orm.fec_emision,
      orm.fec_venc,
      orm.activo
    );
  }

  /**
   * Convierte de Dominio a DTO de Respuesta
   */
static toResponseDto(domain: Quote): QuoteResponseDto {
    return {
      id_cotizacion: domain.id_cotizacion!,
      id_cliente: domain.id_cliente,
      fec_emision: domain.fec_emision,
      fec_venc: domain.fec_venc,
      total: domain.total,
      estado: domain.estado,
      activo: domain.activo
    };
  }
}