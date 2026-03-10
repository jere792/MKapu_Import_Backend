import { Permission } from '../../entity/permission-domain-entity';

export interface IPermissionRepositoryPort {
  // Comandos de escritura
  save(permission: Permission): Promise<Permission>;
  update(permission: Permission): Promise<Permission>;
  delete(id: number): Promise<void>;

  // Consultas de lectura
  findById(id: number): Promise<Permission | null>;
  findByName(nombre: string): Promise<Permission | null>;
  findAll(filters?: {
    activo?: boolean;
    search?: string;
  }): Promise<Permission[]>;

  // Validaciones
  existsByName(nombre: string): Promise<boolean>;
}