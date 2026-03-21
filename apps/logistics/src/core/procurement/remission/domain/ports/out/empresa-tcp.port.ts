export interface EmpresaInfoResponse {
  ruc: string;
  razonSocial: string;
  direccion: string;
  ciudad: string;
  email: string;
}

export interface EmpresaTcpPortOut {
  getEmpresaData(): Promise<EmpresaInfoResponse | null>;
}
