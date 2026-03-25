import { RegisterClaimDto } from '../../../application/dto/in/register-claim-dto';
import { ClaimResponseDto } from '../../../application/dto/out/claim-response-dto';
import { Claim } from '../../entity/claim-domain-entity';

export const CLAIM_COMMAND_PORT = 'IClaimCommandPort';
export const CLAIM_QUERY_PORT = 'IClaimQueryPort';

export interface IClaimCommandPort {
  register(dto: RegisterClaimDto): Promise<ClaimResponseDto>; 
  attend(id: number, respuesta: string): Promise<ClaimResponseDto>;
  resolve(id: number, respuesta: string): Promise<ClaimResponseDto>;
}

export interface IClaimQueryPort {
  getById(id: number): Promise<Claim>;
  listBySalesReceipt(receiptId: number): Promise<Claim[]>;
  listBySede(sedeId: number): Promise<ClaimResponseDto[]>;
  exportPdf(id: number): Promise<Buffer>;
}
