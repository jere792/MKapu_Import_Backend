// application/dto/in/actualizar-terminos.dto.ts
import { PartialType } from '@nestjs/mapped-types';
import { CrearTerminosDto } from './crear-terminos.dto';

export class ActualizarTerminosDto extends PartialType(CrearTerminosDto) {}