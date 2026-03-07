export class RolePermissionDomain {
  constructor(
    public readonly id_rol:     number,
    public readonly id_permiso: number,
  ) {}
}

// Para respuestas enriquecidas
export class RoleWithPermissionsDomain {
  constructor(
    public readonly id_rol:      number,
    public readonly nombre:      string,
    public readonly descripcion: string | null,
    public readonly activo:      boolean,
    public readonly permisos:    PermissionSummary[],
  ) {}
}

export interface PermissionSummary {
  id_permiso:  number;
  nombre:      string;
  descripcion: string;
  activo:      boolean;
}