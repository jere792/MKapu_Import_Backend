import { 
  Injectable, 
  Inject, 
  ConflictException, 
  NotFoundException, 
} from '@nestjs/common';
import { ICashboxCommandPort } from '../../domain/ports/in/cashbox-ports-in';
import { ICashboxRepositoryPort } from '../../domain/ports/out/cashbox-ports-out';
import { OpenCashboxDto, CloseCashboxDto } from '../dto/in';
import { CashboxResponseDto } from '../dto/out';
import { CashboxMapper } from '../mapper/cashbox.mapper';
import { CashboxWebSocketGateway } from '../../infrastructure/adapters/out/cashbox-websocket.gateway';
import { Cashbox } from '../../domain/entity/cashbox-domain-entity';

@Injectable()
export class CashboxCommandService implements ICashboxCommandPort {
  constructor(
    @Inject('ICashboxRepositoryPort')
    private readonly repository: ICashboxRepositoryPort, 
    private readonly gateway: CashboxWebSocketGateway,   
  ) {}

  async openCashbox(dto: OpenCashboxDto): Promise<CashboxResponseDto> {
    const hasActive = await this.repository.existsActiveInSede(dto.id_sede_ref);
    if (hasActive) throw new ConflictException(`Sede ya tiene caja abierta`);

    const domain = new Cashbox(
      CashboxMapper.generateId(dto.id_sede_ref),
      dto.id_sede_ref,
      'ABIERTA',
      new Date(),
      null,
      dto.monto_inicial ?? null,
    );

    const savedDomain = await this.repository.save(domain);
    const response    = CashboxMapper.toResponseDto(savedDomain);
    this.gateway.notifyCashboxOpened(response);
    return response;
  }

  async closeCashbox(dto: CloseCashboxDto): Promise<CashboxResponseDto> {
    const domain = await this.repository.findById(dto.id_caja);
    if (!domain) throw new NotFoundException('Caja no encontrada');

    domain.cerrarCaja();

    const updatedDomain = await this.repository.update(domain);
    const response      = CashboxMapper.toResponseDto(updatedDomain);
    this.gateway.notifyCashboxClosed(response);
    return response;
  }
}