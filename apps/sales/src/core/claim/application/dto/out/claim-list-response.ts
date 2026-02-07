import { ClaimResponseDto } from "./claim-response-dto";

export interface ClaimListResponse {
    data: ClaimResponseDto[];
    total: number;
    page: number;
    limit: number;
}