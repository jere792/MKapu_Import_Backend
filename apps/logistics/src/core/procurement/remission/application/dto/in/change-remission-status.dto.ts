import { IsEnum, IsNotEmpty } from 'class-validator';

export enum ValidRemissionStatus {
  EMITIDO = 'EMITIDO',
  EN_CAMINO = 'EN_CAMINO',
  ENTREGADO = 'ENTREGADO',
  RECHAZADO = 'RECHAZADO',
  ANULADO = 'ANULADO',
}

export class ChangeRemissionStatusDto {
  @IsNotEmpty({ message: 'El estado no puede estar vacío' })
  @IsEnum(ValidRemissionStatus, {
    message: 'El estado proporcionado no es válido',
  })
  estado: string;
}
