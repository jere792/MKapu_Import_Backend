import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { IClaimCommandPort } from '../../domain/ports/in/claim-port-in';
import { Claim } from '../../domain/entity/claim-domain-entity';
import { RegisterClaimDto } from '../dto/in/register-claim-dto';
import {
  CLAIM_PORT_OUT,
  ClaimPortOut,
} from '../../domain/ports/out/claim-port-out';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SalesReceiptOrmEntity } from '../../../sales-receipt/infrastructure/entity/sales-receipt-orm.entity';
import { ClaimMapper } from '../mapper/claim.mapper';
import { ClaimResponseDto } from '../dto/out/claim-response-dto';
import { ClaimDetail } from '../../domain/entity/claim-detail-domain-entity';

@Injectable()
export class ClaimCommandService implements IClaimCommandPort {
  constructor(
    @Inject(CLAIM_PORT_OUT)
    private readonly claimRepository: ClaimPortOut,
    @InjectRepository(SalesReceiptOrmEntity)
    private readonly salesReceiptRepository: Repository<SalesReceiptOrmEntity>,
  ) {}
  async register(dto: RegisterClaimDto): Promise<Claim> {
    const saleExists = await this.salesReceiptRepository.findOne({
      where: { id_comprobante: dto.id_comprobante },
    });
    if (!saleExists) {
      throw new NotFoundException(
        `El comprobante de venta con ID ${dto.id_comprobante} no existe.`,
      );
    }
    const newClaim = ClaimMapper.fromRegisterDto(dto);
    const savedClaim = await this.claimRepository.save(newClaim);
    return savedClaim;
  }
  async attend(id: number, respuesta: string): Promise<ClaimResponseDto> {
    const claim = await this.claimRepository.findById(id);
    if (!claim)
      throw new NotFoundException(`Reclamo con ID ${id} no encontrado`);

    const claimEnProceso = claim.iniciarReclamo();

    const nuevoDetalle = ClaimDetail.create({
      tipo: 'ATENCIÓN (En Proceso)',
      descripcion: respuesta,
      fecha: new Date(),
    });

    const claimConHistorial = claimEnProceso.agregarDetalle(nuevoDetalle);
    await this.claimRepository.save(claimConHistorial);

    return ClaimMapper.toResponseDto(claimConHistorial);
  }
  async resolve(id: number, respuesta: string): Promise<ClaimResponseDto> {
    const claim = await this.claimRepository.findById(id);
    if (!claim)
      throw new NotFoundException(`Reclamo con ID ${id} no encontrado`);

    const claimResolved = claim.resolver(respuesta);

    const detalleResolucion = ClaimDetail.create({
      tipo: 'RESOLUCIÓN (Finalizado)',
      descripcion: respuesta,
      fecha: new Date(),
    });

    const claimConHistorial = claimResolved.agregarDetalle(detalleResolucion);
    await this.claimRepository.save(claimConHistorial);

    return ClaimMapper.toResponseDto(claimConHistorial);
  }
}
