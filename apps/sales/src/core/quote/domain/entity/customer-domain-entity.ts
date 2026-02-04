export class Customer {
  constructor(
    public readonly id_cliente: string,
    public readonly nombres: string,
    public readonly valor_doc: string,
    public readonly estado: boolean = true,
    public readonly email?: string,
    public readonly direccion?: string,
    public readonly telefono?: string,
  ) {}

  // Ejemplo de lógica de dominio
  esValidoParaCredito(): boolean {
    return this.estado === true;
  }
}