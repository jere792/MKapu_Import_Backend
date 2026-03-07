import { IsInt, IsPositive } from 'class-validator';
import { Type } from 'class-transformer';

export class RemovePermissionFromRoleDto {
  @IsInt() @IsPositive() @Type(() => Number)
  roleId: number;

  @IsInt() @IsPositive() @Type(() => Number)
  permissionId: number;
}