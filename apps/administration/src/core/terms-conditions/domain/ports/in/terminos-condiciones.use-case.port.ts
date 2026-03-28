// domain/ports/in/terminos-condiciones.use-case.port.ts
import { TerminosCondicionesDomain } from '../../entity/terminos-condiciones.domain';

export const TERMINOS_USE_CASE_PORT = 'TERMINOS_USE_CASE_PORT';

export interface TerminosCondicionesUseCasePort {
  getActivo(): Promise<TerminosCondicionesDomain>;
  getAll(): Promise<TerminosCondicionesDomain[]>;
  getById(id: number): Promise<TerminosCondicionesDomain>;
  crear(terminos: TerminosCondicionesDomain): Promise<TerminosCondicionesDomain>;
  actualizar(id: number, terminos: TerminosCondicionesDomain): Promise<TerminosCondicionesDomain>;
  activar(id: number): Promise<void>;
  eliminar(id: number): Promise<void>;
}