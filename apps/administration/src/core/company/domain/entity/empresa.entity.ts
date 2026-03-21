export class Empresa {
  constructor(
    public readonly id: number,
    public nombreComercial: string,
    public razonSocial: string | null,
    public ruc: string,
    public sitioWeb: string | null,
    public direccion: string | null,
    public ciudad: string | null,
    public departamento: string | null,
    public telefono: string | null,
    public email: string | null,
    public logoUrl: string | null,
    public logoPublicId: string | null,
    public updatedAt: Date,
  ) {}
}
