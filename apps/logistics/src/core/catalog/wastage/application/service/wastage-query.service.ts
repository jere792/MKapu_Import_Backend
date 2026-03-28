import { Injectable, Inject } from '@nestjs/common';
import { IWastageQueryPort } from '../../domain/ports/in/wastage.port.in';
import { IWastageRepositoryPort } from '../../domain/ports/out/wastage.port.out';
import {
  WastageResponseDto,
  WastagePaginatedResponseDto,
} from '../dto/out/wastage-response.dto';

import { WastageSuggestionDto } from '../dto/out/wastage-suggestion-response.dto';

import { WastageMapper } from '../mapper/wastage.mapper';

@Injectable()
export class WastageQueryService implements IWastageQueryPort {
  constructor(
    @Inject('IWastageRepositoryPort')
    private readonly repository: IWastageRepositoryPort,
  ) {}

  async findAll(): Promise<WastageResponseDto[]> {
    const wastages = await this.repository.findAll();
    return wastages.map((w) => WastageMapper.toResponseDto(w));
  }

  async findAllPaginated(
    page: number = 1,
    limit: number = 10,
    id_sede?: number,
  ): Promise<WastagePaginatedResponseDto> {
    const skip = (page - 1) * limit;

    const [wastages, total] = await this.repository.findAndCount(
      skip,
      limit,
      id_sede || undefined,
    );

    return {
      data: wastages.map((w) => WastageMapper.toResponseDto(w)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(id: number): Promise<WastageResponseDto> {
    const wastage = await this.repository.findById(id);
    return WastageMapper.toResponseDto(wastage);
  }

  async search(
    q: string,
    id_sede?: number,
    limit = 8,
  ): Promise<WastageSuggestionDto[]> {
    const results = await this.repository.searchSuggestions(q, id_sede, limit);
    return results.map((w) => {
      // Suma de cantidades (unidades totales)
      const totalUnidades =
        w.detalles?.reduce((acc, d) => acc + (d.cantidad ?? 0), 0) ?? 0;
      // Número de productos distintos
      const totalProductos = (w as any).total_items ?? w.detalles?.length ?? 0;

      return {
        id_merma: w.id_merma!,
        codigo: `MER-${String(w.id_merma).padStart(4, '0')}`,
        motivo: w.motivo,
        tipo_merma: (w as any).tipo_merma_label ?? '',
        descripcion: `${totalProductos} producto(s) · ${totalUnidades} unid. · ${(w as any).responsable ?? 'Sin responsable'}`,
        fec_merma: w.fec_merma?.toISOString?.() ?? '',
      };
    });
  }
}
