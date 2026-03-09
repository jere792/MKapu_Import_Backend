import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsEnum,
  IsISO8601,
} from 'class-validator';
import { DispatchStatus } from '../../../domain/entity/dispatch-domain-entity';

import { PartialType } from '@nestjs/swagger';
import { CreateDispatchDto } from './dispatch-dto-in';

export class UpdateDispatchDto extends PartialType(CreateDispatchDto) {
  @IsOptional()
  @IsNumber()
  id_despacho: number;
}