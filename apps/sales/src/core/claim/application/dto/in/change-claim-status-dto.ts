import { ClaimStatus } from "../../../domain/entity/claim-detail-domain-entity";

export interface ChangeClaimStatusDto {
    id_reclamo: number;
    accion: ClaimStatus;
    observacion?: string;
}