import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Claim } from '../../../../domain/entity/claim-domain-entity';
import { ClaimOrmEntity } from '../../../entity/claim-orm.entity';
import { ClaimMapper } from '../../../../application/mapper/claim.mapper';
import { ClaimPortOut } from '../../../../domain/ports/out/claim-port-out';

@Injectable()
export class ClaimTypeormRepository implements ClaimPortOut {
  constructor(
    @InjectRepository(ClaimOrmEntity)
    private readonly claimRepository: Repository<ClaimOrmEntity>,
  ) {}
  async findByReceiptId(receiptId: number): Promise<Claim[] | null> {
    const claims = await this.claimRepository.find({
      where: { id_comprobante: receiptId },
      relations: ['detalles'],
      order: { fecha_registro: 'DESC' },
    });
    return claims.map((orm) => ClaimMapper.toDomain(orm));
  }
  async save(claim: Claim): Promise<Claim> {
    const claimOrm = ClaimMapper.toOrm(claim);
    const savedClaimOrm = await this.claimRepository.save(claimOrm);
    return ClaimMapper.toDomain(savedClaimOrm);
  }
  async findById(id: number): Promise<Claim | null> {
    const claimOrm = await this.claimRepository.findOne({
      where: { id_reclamo: id },
      relations: ['detalles'],
    });

    return claimOrm ? ClaimMapper.toDomain(claimOrm) : null;
  }
  async update(claim: Claim): Promise<void> {
    await this.save(claim);
  }
  async findBySedeId(sedeId: number): Promise<Claim[]> {
    const claimsOrm = await this.claimRepository.find({
      where: {
        id_sede: Number(sedeId),
      },
      relations: ['detalles'],
      order: { fecha_registro: 'DESC' },
    });

    return claimsOrm.map((orm) => ClaimMapper.toDomain(orm));
  }
}
