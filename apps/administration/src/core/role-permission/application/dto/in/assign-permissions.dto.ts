import { IsInt, IsArray, ArrayMinSize, IsPositive } from 'class-validator';
import { Type } from 'class-transformer';

export class AssignPermissionsDto {
  @IsInt() @IsPositive() @Type(() => Number)
  roleId: number;

  @IsArray() @ArrayMinSize(1) @IsInt({ each: true }) @IsPositive({ each: true })
  permissionIds: number[];
}