// application/service/query/terminos-condiciones.query.ts
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { TERMINOS_REPOSITORY_PORT, TerminosCondicionesRepositoryPort,
} from '../../../domain/ports/out/terminos-condiciones.repository.port';
import { TerminosCondicionesMapper } from '../../mapper/terminos-condiciones.mapper';
import { TerminosResponseDto }       from '../../dto/out/terminos-response.dto';

@Injectable()
export class TerminosCondicionesQuery {
  constructor(
    @Inject(TERMINOS_REPOSITORY_PORT)
    private readonly repo: TerminosCondicionesRepositoryPort,
    private readonly mapper: TerminosCondicionesMapper,
  ) {}

  async getActivo(): Promise<TerminosResponseDto> {
    const data = await this.repo.findActivo();
    if (!data) throw new NotFoundException('No hay versión activa de términos.');
    return this.mapper.domainToDto(data);
  }

  async getAll(): Promise<TerminosResponseDto[]> {
    const data = await this.repo.findAll();
    return data.map(d => this.mapper.domainToDto(d));
  }

  async getById(id: number): Promise<TerminosResponseDto> {
    const data = await this.repo.findById(id);
    if (!data) throw new NotFoundException(`Versión ${id} no encontrada.`);
    return this.mapper.domainToDto(data);
  }
}