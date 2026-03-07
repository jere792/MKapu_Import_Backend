/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */
import {
  ClaimDetail,
  ClaimStatus,
} from '../../domain/entity/claim-detail-domain-entity';
import { Claim, ClaimProps } from '../../domain/entity/claim-domain-entity';
import { ClaimDetailOrmEntity } from '../../infrastructure/entity/claim-detail-orm.entity';
import { ClaimOrmEntity } from '../../infrastructure/entity/claim-orm.entity';
import { RegisterClaimDto } from '../dto/in/register-claim-dto';
import { UpdateClaimDto } from '../dto/in/update-claim-dto';
import { ClaimListResponse } from '../dto/out/claim-list-response';
import { ClaimResponseDto } from '../dto/out/claim-response-dto';

export class ClaimMapper {
  static toDomain(ormEntity: ClaimOrmEntity): Claim {
    const props: ClaimProps = {
      id_reclamo: ormEntity.id_reclamo,
      id_comprobante: ormEntity.id_comprobante,
      id_vendedor_ref: ormEntity.id_vendedor_ref,
      motivo: ormEntity.motivo,
      descripcion: ormEntity.descripcion,
      respuesta: ormEntity.respuesta,
      estado: ormEntity.estado as ClaimStatus,
      fecha_registro: ormEntity.fecha_registro,
      fecha_resolucion: ormEntity.fecha_resolucion,

      detalles:
        ormEntity.detalles?.map((d) =>
          ClaimDetail.create({
            tipo: d.tipo,
            descripcion: d.descripcion,
            fecha: d.fecha || new Date(), // Pasamos la fecha al Dominio
          }),
        ) || [],
    };
    return Claim.create(props);
  }
  static toOrm(domainEntity: Claim): ClaimOrmEntity {
    const orm = new ClaimOrmEntity();
    if (domainEntity.id_reclamo) {
      orm.id_reclamo = domainEntity.id_reclamo;
    }
    orm.id_comprobante = domainEntity.id_comprobante;
    orm.id_vendedor_ref = domainEntity.id_vendedor_ref;
    orm.motivo = domainEntity.motivo;
    orm.descripcion = domainEntity.descripcion;
    orm.respuesta = domainEntity.respuesta;
    orm.estado = domainEntity.estado;
    orm.fecha_registro = domainEntity.fecha_registro;

    if (domainEntity.fecha_resolucion) {
      orm.fecha_resolucion = domainEntity.fecha_resolucion;
    }

    if (domainEntity.detalles && domainEntity.detalles.length > 0) {
      orm.detalles = domainEntity.detalles.map((d) => {
        const detalleOrm = new ClaimDetailOrmEntity();
        detalleOrm.tipo = d.tipo;
        detalleOrm.descripcion = d.descripcion;
        detalleOrm.fecha = d.fecha;
        return detalleOrm;
      });
    }

    return orm;
  }

  static toResponseDto(claim: Claim): ClaimResponseDto {
    return {
      claimId: claim.id_reclamo!,
      receiptId: claim.id_comprobante,
      sellerId: claim.id_vendedor_ref,
      reason: claim.motivo,
      description: claim.descripcion,
      status: claim.estado,
      registeredAt: claim.fecha_registro,
      resolvedAt: claim.fecha_resolucion,
      respuesta: claim.respuesta,
      detalles: claim.detalles.map((d) => ({
        tipo: d.tipo,
        descripcion: d.descripcion,
        fecha: d.fecha,
      })),
    };
  }

  static toListResponse(claims: Claim[]): ClaimListResponse {
    return {
      data: claims.map((claim) => this.toResponseDto(claim)),
      total: claims.length,
      page: 1,
      limit: claims.length,
    };
  }

  static fromRegisterDto(dto: RegisterClaimDto): Claim {
    return Claim.createNew(
      dto.id_comprobante,
      dto.id_vendedor_ref,
      dto.motivo,
      dto.descripcion,
    );
  }

  static fromUpdateDto(claim: Claim, dto: UpdateClaimDto): Claim {
    return Claim.create({
      id_reclamo: claim.id_reclamo,
      id_comprobante: claim.id_comprobante,
      id_vendedor_ref: claim.id_vendedor_ref,
      motivo: dto.reason ?? claim.motivo,
      descripcion: dto.description ?? claim.descripcion,
      estado: claim.estado,
      fecha_registro: claim.fecha_registro,
      fecha_resolucion: claim.fecha_resolucion,
      detalles: claim.detalles,
    });
  }

  static withStatus(claim: Claim, status: ClaimStatus): Claim {
    return Claim.create({
      id_reclamo: claim.id_reclamo,
      id_comprobante: claim.id_comprobante,
      id_vendedor_ref: claim.id_vendedor_ref,
      motivo: claim.motivo,
      descripcion: claim.descripcion,
      estado: status,
      fecha_registro: claim.fecha_registro,
      fecha_resolucion: status ? new Date() : claim.fecha_resolucion,
      detalles: claim.detalles,
    });
  }
}
