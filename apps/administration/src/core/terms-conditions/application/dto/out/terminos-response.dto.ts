// application/dto/out/terminos-response.dto.ts
export class TerminosItemResponseDto {
  id:        number;
  contenido: string;
  orden:     number;
}

export class TerminosParrafoResponseDto {
  id:        number;
  contenido: string;
  orden:     number;
}

export class TerminosSeccionResponseDto {
  id:      number;
  numero:  string;
  titulo:  string;
  orden:   number;
  parrafos: TerminosParrafoResponseDto[];
  items:    TerminosItemResponseDto[];
}

export class TerminosResponseDto {
  id:             number;
  version:        string;
  fechaVigencia:  string;
  activo:         boolean;
  creadoEn:       string;
  actualizadoEn:  string;
  secciones:      TerminosSeccionResponseDto[];
}