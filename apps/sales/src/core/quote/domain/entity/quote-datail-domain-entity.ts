export class QuoteDetail {
  constructor(
    public readonly id_detalle: number | null, 
    public readonly id_cotizacion: number,
    public readonly id_prod_ref: number,
    public cod_prod: string,
    public descripcion: string,
    public cantidad: number,
    public precio: number
  ) {
    this.validarCantidad();
    this.validarPrecio();
    this.validarCampos();
  }

  // Calcula el importe total del detalle (cantidad * precio)
  get importe(): number {
    return this.cantidad * this.precio;
  }

  // Regla de negocio: Validar que la cantidad no sea negativa o cero
  private validarCantidad(): void {
    if (this.cantidad <= 0) throw new Error('La cantidad debe ser mayor a cero');
  }

  // Regla: Validar que el precio no sea negativo
  private validarPrecio(): void {
    if (this.precio < 0) throw new Error('El precio no puede ser negativo');
  }

  // Regla: Validar campos obligatorios
  private validarCampos(): void {
    if (!this.cod_prod?.trim()) throw new Error('Código de producto requerido');
    if (!this.descripcion?.trim()) throw new Error('Descripción requerida');
    if (!this.id_prod_ref) throw new Error('Referencia de producto requerida');
  }

  // Lógica: ¿Puede agregarse producto?
  esAgregable(stockDisponible: number): boolean {
    return this.cantidad <= stockDisponible;
  }

  // Regla: permite agregar descuentos (opcional)
  aplicarDescuento(descuentoPorc: number): void {
    if (descuentoPorc < 0 || descuentoPorc > 100) {
      throw new Error('Descuento fuera de rango permitido');
    }
    this.precio = parseFloat((this.precio * (1 - descuentoPorc / 100)).toFixed(2));
  }

  // Lógica: Validar stock para registrarla en cotización
  validarStock(stockDisponible: number): void {
    if (this.cantidad > stockDisponible) {
      throw new Error('No hay suficiente stock para el producto');
    }
  }

  // Actualiza cantidad
  actualizarCantidad(nuevaCantidad: number, stockDisponible: number): void {
    if (nuevaCantidad <= 0) throw new Error('Cantidad debe ser mayor a cero');
    if (nuevaCantidad > stockDisponible) throw new Error('Stock insuficiente');
    this.cantidad = nuevaCantidad;
  }
}