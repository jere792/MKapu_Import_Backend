export interface BankProps {
  id_banco?: number;
  nombre_banco: string;
}

export class Bank {
  private constructor(private readonly props: BankProps) {}

  static create(props: BankProps): Bank {
    if (!props.nombre_banco || props.nombre_banco.trim().length === 0)
      throw new Error('El nombre del banco es obligatorio');
    return new Bank(props);
  }

  get id_banco(): number | undefined { return this.props.id_banco; }
  get nombre_banco(): string          { return this.props.nombre_banco; }
}