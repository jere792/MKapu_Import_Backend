// application/service/command/terminos-condiciones.command.ts
import { Inject, Injectable, NotFoundException,
         BadRequestException } from '@nestjs/common';
import { TERMINOS_REPOSITORY_PORT, TerminosCondicionesRepositoryPort,
} from '../../../domain/ports/out/terminos-condiciones.repository.port';
import { TerminosCondicionesMapper } from '../../mapper/terminos-condiciones.mapper';
import { CrearTerminosDto }          from '../../dto/in/crear-terminos.dto';
import { TerminosResponseDto }       from '../../dto/out/terminos-response.dto';
import { ActualizarTerminosDto } from '../../dto/in/actualizar-terminos.dto';

@Injectable()
export class TerminosCondicionesCommand {
  constructor(
    @Inject(TERMINOS_REPOSITORY_PORT)
    private readonly repo: TerminosCondicionesRepositoryPort,
    private readonly mapper: TerminosCondicionesMapper,
  ) {}

  async crear(dto: CrearTerminosDto): Promise<TerminosResponseDto> {
    const domain = this.mapper.dtoToDomain(dto);
    const saved  = await this.repo.save(domain);
    return this.mapper.domainToDto(saved);
  }

  async actualizar(id: number, dto: ActualizarTerminosDto): Promise<TerminosResponseDto> {
    const exists = await this.repo.findById(id);
    if (!exists) throw new NotFoundException(`Versión ${id} no encontrada.`);
    const domain  = this.mapper.dtoToDomain(dto as CrearTerminosDto);
    const updated = await this.repo.update(id, domain);
    return this.mapper.domainToDto(updated);
  }

  async activar(id: number): Promise<void> {
    const exists = await this.repo.findById(id);
    if (!exists) throw new NotFoundException(`Versión ${id} no encontrada.`);
    await this.repo.activar(id);
  }

  async eliminar(id: number): Promise<void> {
    const exists = await this.repo.findById(id);
    if (!exists) throw new NotFoundException(`Versión ${id} no encontrada.`);
    if (exists.activo) throw new BadRequestException('No se puede eliminar la versión activa.');
    await this.repo.eliminar(id);
  }
}