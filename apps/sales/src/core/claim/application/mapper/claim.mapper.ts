import { ClaimStatus } from "../../domain/entity/claim-detail-domain-entity";
import { Claim } from "../../domain/entity/claim-domain-entity";
import { RegisterClaimDto } from "../dto/in/register-claim-dto";
import { UpdateClaimDto } from "../dto/in/update-claim-dto";
import { ClaimListResponse } from "../dto/out/claim-list-response";
import { ClaimResponseDto } from "../dto/out/claim-response-dto";

export class ClaimMapper {
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
        };
    }

    static toListResponse(claims: Claim[]): ClaimListResponse {
        return {
            data: claims.map(claim => this.toResponseDto(claim)),
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
            dto.descripcion // agregar el campo de detalles si es necesario
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
            detalles: claim.detalles, // actualizar detalles si es necesario
        })
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
        })
    }
}