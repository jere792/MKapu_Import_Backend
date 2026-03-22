export interface CommissionReportFlat {
  id_comision:        number;
  id_vendedor_ref:    string;
  nombre_vendedor:    string;
  id_comprobante:     number;
  id_sede:            number;
  nombre_sede:        string;
  porcentaje:         number;
  monto:              number;
  estado:             string;
  fecha_registro:     Date;
  fecha_liquidacion?: Date;
  id_regla?:          number;
}