import { Dispatch } from '../../domain/entity/dispatch-domain-entity';
import { DispatchDetail, DispatchDetailStatus } from '../../domain/entity/dispatch-detail-domain-entity';
import { DispatchDetailOutputDto, DispatchOutputDto } from '../dto/out/dispatch-output.dto';
import { DispatchOrmEntity } from '../../infrastructure/entity/dispatch-orm.entity';
import { DispatchDetailOrmEntity } from '../../infrastructure/entity/dispatch-detail-orm.entity';

export class DispatchMapper {

  // ── Domain → OutputDto ──────────────────────────────────────────

  static toOutputDto(domain: Dispatch): DispatchOutputDto {
    return {
      id_despacho:      domain.id_despacho,
      id_venta_ref:     domain.id_venta_ref,
      id_usuario_ref:   domain.id_usuario_ref,
      id_almacen_origen: domain.id_almacen_origen,
      fecha_creacion:   domain.fecha_creacion,
      fecha_programada: domain.fecha_programada,
      fecha_salida:     domain.fecha_salida,
      fecha_entrega:    domain.fecha_entrega,
      direccion_entrega: domain.direccion_entrega,
      observacion:      domain.observacion,
      estado:           domain.estado,
      tieneFaltantes:   domain.tieneFaltantes,
      estaActivo:       domain.estaActivo,
      detalles:         domain.detalles.map(DispatchMapper.detailToOutputDto),
    };
  }

  static detailToOutputDto(domain: DispatchDetail): DispatchDetailOutputDto {
    return {
      id_detalle_despacho: domain.id_detalle_despacho,
      id_producto:         domain.id_producto,
      cantidad_solicitada: domain.cantidad_solicitada,
      cantidad_despachada: domain.cantidad_despachada,
      estado:              domain.estado,
      tieneFaltante:       domain.tieneFaltante,
    };
  }

  // ── ORM → Domain ─────────────────────────────────────────────────

  static toDomain(orm: DispatchOrmEntity, detalles: DispatchDetail[] = []): Dispatch {
    return new (Dispatch as any)(
      orm.id_despacho,
      orm.id_venta_ref,
      orm.id_usuario_ref,
      orm.id_almacen_origen,
      orm.fecha_creacion,
      orm.fecha_programada,
      orm.fecha_salida,
      orm.fecha_entrega,
      orm.direccion_entrega,
      orm.observacion,
      orm.estado,
      detalles,
    );
  }

  static detailToDomain(orm: DispatchDetailOrmEntity): DispatchDetail {
    return new DispatchDetail(
      orm.id_detalle_despacho,
      orm.id_despacho,        
      orm.id_producto,
      orm.cantidad_solicitada,
      orm.cantidad_despachada,
      orm.estado,
    );
  }
  
  // ── Domain → ORM ─────────────────────────────────────────────────

  static toOrm(domain: Dispatch): DispatchOrmEntity {
    const orm = new DispatchOrmEntity();
    if (domain.id_despacho) orm.id_despacho = domain.id_despacho;
    orm.id_venta_ref      = domain.id_venta_ref;
    orm.id_usuario_ref    = domain.id_usuario_ref;
    orm.id_almacen_origen = domain.id_almacen_origen;
    orm.fecha_creacion    = domain.fecha_creacion;
    orm.fecha_programada  = domain.fecha_programada;
    orm.fecha_salida      = domain.fecha_salida;
    orm.fecha_entrega     = domain.fecha_entrega;
    orm.direccion_entrega = domain.direccion_entrega;
    orm.observacion       = domain.observacion;
    orm.estado            = domain.estado;
    return orm;
  }

  static detailToOrm(domain: DispatchDetail, id_despacho: number): DispatchDetailOrmEntity {
    const orm = new DispatchDetailOrmEntity();
    if (domain.id_detalle_despacho) orm.id_detalle_despacho = domain.id_detalle_despacho;
    orm.id_despacho          = id_despacho;
    orm.id_producto          = domain.id_producto;
    orm.cantidad_solicitada  = domain.cantidad_solicitada;
    orm.cantidad_despachada  = domain.cantidad_despachada;
    orm.estado               = domain.estado;
    return orm;
  }
}
