/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import {
  Remission,
  RemissionDetail,
} from '../../domain/entity/remission-domain-entity';
import { RemissionOrmEntity } from '../../infrastructure/entity/remission-orm.entity';

export class RemissionMapper {
  static toDomain(
    ormEntity: RemissionOrmEntity,
    ormDetails?: any[],
  ): Remission {
    if (!ormEntity) return null;

    const detalles =
      ormDetails?.map(
        (det) =>
          new RemissionDetail(
            det.id_producto,
            det.cod_prod,
            det.cantidad,
            Number(det.peso_total),
            Number(det.peso_unitario),
          ),
      ) || [];

    const props = {
      id_guia: ormEntity.id_guia,
      tipo_guia: ormEntity.tipo_guia,
      serie: ormEntity.serie,
      numero: ormEntity.numero,
      fecha_emision: ormEntity.fecha_emision,
      fecha_inicio: ormEntity.fecha_inicio,
      motivo_traslado: ormEntity.motivo_traslado,
      descripcion: ormEntity.descripcion,
      peso_total: Number(ormEntity.peso_total),
      unidad_peso: ormEntity.unidad_peso,
      cantidad: ormEntity.cantidad,
      modalidad: ormEntity.modalidad,
      estado: ormEntity.estado,
      observaciones: ormEntity.observaciones,
      id_almacen_origen: ormEntity.id_almacen_origen,
      id_comprobante_ref: ormEntity.id_comprobante_ref,
      id_usuario_ref: ormEntity.id_usuario_ref,
      id_sede_ref: Number(ormEntity.id_sede_ref),
      datos_traslado: null,
      datos_transporte: null,
      razon_social: ormEntity.socialReason,
    };

    const remission = Object.create(Remission.prototype);
    Object.assign(remission, {
      props,
      _detalles: detalles,
      _domainEvents: [],
    });

    return remission;
  }

  static toOrm(domainEntity: Remission): RemissionOrmEntity {
    if (!domainEntity) return null;

    const ormEntity = new RemissionOrmEntity();
    ormEntity.id_guia = domainEntity.id_guia;
    ormEntity.tipo_guia = domainEntity.tipo_guia;
    ormEntity.serie = domainEntity.serie;
    ormEntity.numero = domainEntity.numero;
    ormEntity.fecha_emision = domainEntity.fecha_emision;
    ormEntity.fecha_inicio = domainEntity.fecha_inicio;
    ormEntity.motivo_traslado = domainEntity.motivo_traslado;
    ormEntity.descripcion = domainEntity.descripcion;
    ormEntity.peso_total = domainEntity.peso_total;
    ormEntity.unidad_peso = domainEntity.unidad_peso;
    ormEntity.cantidad = domainEntity.cantidad;
    ormEntity.modalidad = domainEntity.modalidad;
    ormEntity.estado = domainEntity.estado;
    ormEntity.observaciones = domainEntity.observaciones;
    ormEntity.id_almacen_origen = domainEntity.id_almacen_origen;
    ormEntity.id_comprobante_ref = domainEntity.id_comprobante_ref;
    ormEntity.id_usuario_ref = domainEntity.id_usuario_ref;

    ormEntity.id_sede_ref = String(domainEntity.id_sede_ref);

    ormEntity.socialReason = domainEntity.razonSocial;

    return ormEntity;
  }

  static toDto(domainEntity: Remission) {
    return {
      id: domainEntity.id_guia,
      serieNumero: domainEntity.getFullNumber(),
      estado: domainEntity.estado,
      fechaEmision: domainEntity.fecha_emision,
      motivoTraslado: domainEntity.motivo_traslado,
      pesoTotal: domainEntity.peso_total,

      razonSocial: domainEntity.razonSocial,
    };
  }
}
