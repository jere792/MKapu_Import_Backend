// domain/ports/out/terminos-condiciones.repository.port.ts
import { TerminosCondicionesDomain } from '../../entity/terminos-condiciones.domain';

export const TERMINOS_REPOSITORY_PORT = 'TERMINOS_REPOSITORY_PORT';

export interface TerminosCondicionesRepositoryPort {
  findActivo(): Promise<TerminosCondicionesDomain | null>;
  findAll(): Promise<TerminosCondicionesDomain[]>;
  findById(id: number): Promise<TerminosCondicionesDomain | null>;
  save(terminos: TerminosCondicionesDomain): Promise<TerminosCondicionesDomain>;
  update(id: number, terminos: TerminosCondicionesDomain): Promise<TerminosCondicionesDomain>;
  activar(id: number): Promise<void>;
  eliminar(id: number): Promise<void>;
}