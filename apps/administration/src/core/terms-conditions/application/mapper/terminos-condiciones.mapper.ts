// application/mapper/terminos-condiciones.mapper.ts
import { Injectable } from '@nestjs/common';
import {
  TerminosCondicionesDomain,
  TerminosSeccionDomain,
  TerminosParrafoDomain,
  TerminosItemDomain,
} from '../../domain/entity/terminos-condiciones.domain';
import { CrearTerminosDto }    from '../dto/in/crear-terminos.dto';
import { TerminosResponseDto, TerminosSeccionResponseDto,
         TerminosParrafoResponseDto, TerminosItemResponseDto,
} from '../dto/out/terminos-response.dto';

@Injectable()
export class TerminosCondicionesMapper {

  dtoToDomain(dto: CrearTerminosDto): TerminosCondicionesDomain {
    return new TerminosCondicionesDomain(
      undefined,
      dto.version,
      new Date(dto.fechaVigencia),
      dto.activo ?? false,
      dto.creadoPor,
      undefined,
      undefined,
      dto.secciones.map((s, i) => new TerminosSeccionDomain(
        undefined,
        s.numero,
        s.titulo,
        s.orden ?? i + 1,
        s.parrafos.map((p, pi) => new TerminosParrafoDomain(undefined, p.contenido, p.orden ?? pi + 1)),
        s.items.map((it, ii)   => new TerminosItemDomain(undefined, it.contenido, it.orden ?? ii + 1)),
      )),
    );
  }

    domainToDto(domain: TerminosCondicionesDomain): TerminosResponseDto {
    const dto = new TerminosResponseDto();
    dto.id            = domain.id!;
    dto.version       = domain.version;

    const fechaVigencia = domain.fechaVigencia instanceof Date
        ? domain.fechaVigencia
        : new Date(domain.fechaVigencia);
    dto.fechaVigencia = fechaVigencia.toISOString().split('T')[0];
    dto.activo        = domain.activo;
    dto.creadoEn      = domain.creadoEn?.toISOString() ?? '';
    dto.actualizadoEn = domain.actualizadoEn?.toISOString() ?? '';
    dto.secciones     = domain.secciones
        .sort((a, b) => a.orden - b.orden)
        .map(s => {
        const sec    = new TerminosSeccionResponseDto();
        sec.id       = s.id!;
        sec.numero   = s.numero;
        sec.titulo   = s.titulo;
        sec.orden    = s.orden;
        sec.parrafos = s.parrafos
            .sort((a, b) => a.orden - b.orden)
            .map(p => ({ id: p.id!, contenido: p.contenido, orden: p.orden }));
        sec.items    = s.items
            .sort((a, b) => a.orden - b.orden)
            .map(i => ({ id: i.id!, contenido: i.contenido, orden: i.orden }));
        return sec;
        });
    return dto;
    }
}