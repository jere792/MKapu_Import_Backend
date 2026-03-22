export class BankResponseDto {
  id_banco: number;
  nombre_banco: string;
}

export class ServiceTypeResponseDto {
  id_servicio: number;
  id_banco: number;
  nombre_servicio: string;
  descripcion?: string;
}
