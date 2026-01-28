/* ============================================
   PORT OUT - Output Port (Infrastructure)
   administration/src/core/user/domain/ports/out/user-port-out.ts
   ============================================ */

import { HeadquartersOrmEntity } from 'apps/administration/src/core/headquarters/infrastructure/entity/headquarters-orm.entity';
import { UserWithAccountResponseDto } from '../../../application/dto/out/user-with-account-response.dto';
import { Usuario } from '../../entity/user-domain-entity';

export interface IUserRepositoryPort {
  save(user: Usuario): Promise<Usuario>;

  update(user: Usuario): Promise<Usuario>;

  delete(id: number): Promise<void>;

  findById(id: number): Promise<Usuario | null>;

  findByDni(dni: string): Promise<Usuario | null>;

  findByEmail(email: string): Promise<Usuario | null>;

  findAll(filters?: { activo?: boolean; search?: string }): Promise<Usuario[]>;

  existsByDni(dni: string): Promise<boolean>;

  existsByEmail(email: string): Promise<boolean>;
  findUserWithAccountById(
    id: number,
  ): Promise<UserWithAccountResponseDto | null>;
  findSedeById(idSede: number): Promise<HeadquartersOrmEntity | null>;
}
