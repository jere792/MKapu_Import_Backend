// sync-permissions.dto.ts
import { IsInt, IsArray, ArrayMinSize } from 'class-validator';

export class SyncPermissionsDto {
  @IsInt()
  roleId: number;

  @IsArray()
  @ArrayMinSize(1, { message: 'Debe asignar al menos un permiso' }) 
  @IsInt({ each: true })
  permissionIds: number[];
}