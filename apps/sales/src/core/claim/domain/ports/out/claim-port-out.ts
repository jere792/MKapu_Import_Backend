import { Claim } from '../../entity/claim-domain-entity';

export const CLAIM_PORT_OUT = 'CLAIM_PORT_OUT';

export interface ClaimPortOut {
  save(claim: Claim): Promise<Claim>;
  findById(id: number): Promise<Claim | null>;
  findByReceiptId(receiptId: number): Promise<Claim[] | null>;
  update(claim: Claim): Promise<void>;
  findBySedeId(sedeId: string): Promise<Claim[]>;
}
