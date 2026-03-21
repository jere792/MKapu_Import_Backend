/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { IClaimQueryPort } from '../../domain/ports/in/claim-port-in';
import { Claim } from '../../domain/entity/claim-domain-entity';
import {
  CLAIM_PORT_OUT,
  ClaimPortOut,
} from '../../domain/ports/out/claim-port-out';
import { ClaimResponseDto } from '../dto/out/claim-response-dto';
import { ClaimMapper } from '../mapper/claim.mapper';
import { EmpresaTcpProxy } from '../../../sales-receipt/infrastructure/adapters/out/TCP/empresa-tcp.proxy';
import { buildClaimPdf } from '../../infrastructure/utils/claim-pdf.util';
@Injectable()
export class ClaimQueryService implements IClaimQueryPort {
  constructor(
    @Inject(CLAIM_PORT_OUT)
    private readonly claimRepository: ClaimPortOut,
    @Inject('IEmpresaProxy')
    private readonly empresaProxy: EmpresaTcpProxy,
  ) {}
  async getById(id: number): Promise<Claim> {
    const claim = await this.claimRepository.findById(id);
    if (!claim) {
      throw new NotFoundException(`El reclamo con ID ${id} no fue encontrado.`);
    }
    return claim;
  }
  async listBySalesReceipt(receiptId: number): Promise<Claim[]> {
    const claims = await this.claimRepository.findByReceiptId(receiptId);
    return claims || [];
  }
  async listBySede(sedeId: number): Promise<ClaimResponseDto[]> {
    const claims = await this.claimRepository.findBySedeId(sedeId);

    if (!claims || claims.length === 0) {
      return [];
    }
    return claims.map((claim) => ClaimMapper.toResponseDto(claim));
  }
  async exportPdf(id: number): Promise<Buffer> {
    const claim = await this.getById(id);
    if (!claim) {
      throw new NotFoundException(`El reclamo con ID ${id} no fue encontrado.`);
    }

    const empresa = await this.empresaProxy.getEmpresaActiva();

    const pdfBuffer = await buildClaimPdf(claim, empresa);

    return pdfBuffer;
  }
}
