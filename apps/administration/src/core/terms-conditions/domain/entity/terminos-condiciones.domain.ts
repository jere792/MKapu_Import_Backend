// domain/entity/terminos-condiciones.domain.ts
export class TerminosCondicionesDomain {
  constructor(
    public id:             number | undefined,
    public version:        string,
    public fechaVigencia:  Date,
    public activo:         boolean,
    public creadoPor:      number | undefined,
    public creadoEn:       Date | undefined,
    public actualizadoEn:  Date | undefined,
    public secciones:      TerminosSeccionDomain[],
  ) {}
}

export class TerminosSeccionDomain {
  constructor(
    public id:       number | undefined,
    public numero:   string,
    public titulo:   string,
    public orden:    number,
    public parrafos: TerminosParrafoDomain[],
    public items:    TerminosItemDomain[],
  ) {}
}

export class TerminosParrafoDomain {
  constructor(
    public id:        number | undefined,
    public contenido: string,
    public orden:     number,
  ) {}
}

export class TerminosItemDomain {
  constructor(
    public id:        number | undefined,
    public contenido: string,
    public orden:     number,
  ) {}
}