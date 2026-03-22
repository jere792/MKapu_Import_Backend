export class EmpresaResponseDto {
  id: number;
  nombreComercial: string;
  razonSocial: string | null;
  ruc: string;
  sitioWeb: string | null;
  direccion: string | null;
  ciudad: string | null;
  departamento: string | null;
  telefono: string | null;
  email: string | null;
  logoUrl: string | null;
  updatedAt: Date;
}
