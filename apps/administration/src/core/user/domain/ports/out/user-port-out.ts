/* ============================================
   PORT OUT - Output Port (Infrastructure)
   administration/src/core/user/domain/ports/out/user-port-out.ts
   ============================================ */

import { Usuario } from '../../entity/user-domain-entity';

/**
 * Puerto de salida para la persistencia de usuarios
 * Este contrato será implementado por el adaptador de infraestructura (TypeORM)
 */
export interface IUserRepositoryPort {
  /**
   * Comandos de escritura - Soportan operaciones REST
   */

  // Guardar nuevo usuario en la base de datos
  save(user: Usuario): Promise<Usuario>;

  // Actualizar usuario existente
  update(user: Usuario): Promise<Usuario>;

  // Eliminar usuario por ID
  delete(id: number): Promise<void>;

  /**
   * Consultas de lectura - Soportan operaciones WebSocket
   */

  // Buscar usuario por ID
  findById(id: number): Promise<Usuario | null>;

  // Buscar usuario por DNI
  findByDni(dni: string): Promise<Usuario | null>;

  // Buscar usuario por Email
  findByEmail(email: string): Promise<Usuario | null>;

  // Listar todos los usuarios con filtros opcionales
  findAll(filters?: { activo?: boolean; search?: string }): Promise<Usuario[]>;

  /**
   * Validaciones auxiliares
   */

  // Verificar si existe un usuario con el DNI dado
  existsByDni(dni: string): Promise<boolean>;

  // Verificar si existe un usuario con el email dado
  existsByEmail(email: string): Promise<boolean>;
}
