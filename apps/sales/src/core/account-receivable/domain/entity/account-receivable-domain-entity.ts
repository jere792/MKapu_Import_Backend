/* ============================================
   sales/src/core/accountreceivable/domain/entity/account-receivable.domain-entity.ts
   ============================================ */

// ─────────────────────────────────────────────────────────────────────────────
// DOMAIN EXCEPTION
// ─────────────────────────────────────────────────────────────────────────────

export class AccountReceivableDomainException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AccountReceivableDomainException';
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// VALUE OBJECT — Money
// ─────────────────────────────────────────────────────────────────────────────

export class Money {
  private static readonly VALID_CURRENCY = /^[A-Z]{3}$/;

  readonly amount:       number;
  readonly currencyCode: string;

  constructor(amount: number, currencyCode: string) {
    if (amount === null || amount === undefined)
      throw new AccountReceivableDomainException('Money: amount is required');

    if (isNaN(amount))
      throw new AccountReceivableDomainException('Money: amount must be a valid number');

    if (amount < 0)
      throw new AccountReceivableDomainException(
        `Money: amount cannot be negative (got ${amount})`,
      );

    if (!currencyCode || !Money.VALID_CURRENCY.test(currencyCode))
      throw new AccountReceivableDomainException(
        `Money: currencyCode must be a 3-letter ISO 4217 code (got "${currencyCode}")`,
      );

    this.amount       = parseFloat(amount.toFixed(2));
    this.currencyCode = currencyCode.toUpperCase();
  }

  static zero(currencyCode: string): Money {
    return new Money(0, currencyCode);
  }

  add(other: Money): Money {
    this.assertSameCurrency(other);
    return new Money(this.amount + other.amount, this.currencyCode);
  }

  subtract(other: Money): Money {
    this.assertSameCurrency(other);
    const result = parseFloat((this.amount - other.amount).toFixed(2));
    if (result < 0)
      throw new AccountReceivableDomainException(
        `Money: subtraction would produce negative amount (${this.amount} - ${other.amount})`,
      );
    return new Money(result, this.currencyCode);
  }

  isGreaterThan(other: Money): boolean {
    this.assertSameCurrency(other);
    return this.amount > other.amount;
  }

  isLessThanOrEqual(other: Money): boolean {
    this.assertSameCurrency(other);
    return this.amount <= other.amount;
  }

  isZero(): boolean {
    return this.amount === 0;
  }

  equals(other: Money): boolean {
    return this.amount === other.amount && this.currencyCode === other.currencyCode;
  }

  private assertSameCurrency(other: Money): void {
    if (this.currencyCode !== other.currencyCode)
      throw new AccountReceivableDomainException(
        `Money: currency mismatch — expected ${this.currencyCode}, got ${other.currencyCode}`,
      );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// ENUM — Estado
// ─────────────────────────────────────────────────────────────────────────────

export enum AccountReceivableStatus {
  PENDIENTE = 'PENDIENTE',
  PARCIAL   = 'PARCIAL',
  PAGADO    = 'PAGADO',
  VENCIDO   = 'VENCIDO',
  CANCELADO = 'CANCELADO',
}

// ─────────────────────────────────────────────────────────────────────────────
// PROPS
// ─────────────────────────────────────────────────────────────────────────────

export interface AccountReceivableProps {
  id:             number | null;
  salesReceiptId: number;
  userRef:        string;
  totalAmount:    Money;
  paidAmount:     Money;
  pendingBalance: Money;
  issueDate:      Date;
  dueDate:        Date;
  updatedAt:      Date | null;
  status:         AccountReceivableStatus;
  paymentTypeId:  number;
  currencyCode:   string;
  observation:    string | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// DOMAIN ENTITY
// ─────────────────────────────────────────────────────────────────────────────

export class AccountReceivable {

  private readonly props: AccountReceivableProps;

  private constructor(props: AccountReceivableProps) {
    this.props = { ...props };
  }

  // ── Factory: nueva cuenta por cobrar ─────────────────────────────
  static create(params: {
    salesReceiptId: number;
    userRef:        string;
    totalAmount:    Money;
    dueDate:        Date;
    paymentTypeId:  number;
    currencyCode:   string;
    observation?:   string | null;
  }): AccountReceivable {

    AccountReceivable.validateSalesReceiptId(params.salesReceiptId);
    AccountReceivable.validateUserRef(params.userRef);
    AccountReceivable.validateTotalAmount(params.totalAmount);
    AccountReceivable.validateDueDate(params.dueDate);
    AccountReceivable.validatePaymentTypeId(params.paymentTypeId);
    AccountReceivable.validateCurrencyCode(params.currencyCode);
    AccountReceivable.validateCurrencyConsistency(params.totalAmount, params.currencyCode);

    const zero = Money.zero(params.currencyCode);

    return new AccountReceivable({
      id:             null,
      salesReceiptId: params.salesReceiptId,
      userRef:        params.userRef.trim(),
      totalAmount:    params.totalAmount,
      paidAmount:     zero,
      pendingBalance: params.totalAmount,
      issueDate:      new Date(),
      dueDate:        params.dueDate,
      updatedAt:      null,
      status:         AccountReceivableStatus.PENDIENTE,
      paymentTypeId:  params.paymentTypeId,
      currencyCode:   params.currencyCode.toUpperCase(),
      observation:    params.observation ?? null,
    });
  }

  // ── Factory: reconstruir desde persistencia ───────────────────────
  static reconstitute(props: AccountReceivableProps): AccountReceivable {
    if (!props.id)
      throw new AccountReceivableDomainException(
        'AccountReceivable.reconstitute: id is required',
      );
    return new AccountReceivable(props);
  }

  // ── Getters ───────────────────────────────────────────────────────
  get id():             number | null           { return this.props.id; }
  get salesReceiptId(): number                  { return this.props.salesReceiptId; }
  get userRef():        string                  { return this.props.userRef; }
  get totalAmount():    Money                   { return this.props.totalAmount; }
  get paidAmount():     Money                   { return this.props.paidAmount; }
  get pendingBalance(): Money                   { return this.props.pendingBalance; }
  get issueDate():      Date                    { return this.props.issueDate; }
  get dueDate():        Date                    { return this.props.dueDate; }
  get updatedAt():      Date | null             { return this.props.updatedAt; }
  get status():         AccountReceivableStatus { return this.props.status; }
  get paymentTypeId():  number                  { return this.props.paymentTypeId; }
  get currencyCode():   string                  { return this.props.currencyCode; }
  get observation():    string | null           { return this.props.observation; }

  // ─────────────────────────────────────────────────────────────────
  // COMPORTAMIENTO DE DOMINIO
  // ─────────────────────────────────────────────────────────────────

  applyPayment(amount: Money): void {
    this.assertIsOpen('applyPayment');

    if (amount.isZero())
      throw new AccountReceivableDomainException(
        'applyPayment: payment amount must be greater than zero',
      );

    if (amount.isGreaterThan(this.props.pendingBalance))
      throw new AccountReceivableDomainException(
        `applyPayment: payment (${amount.amount}) exceeds pending balance (${this.props.pendingBalance.amount})`,
      );

    AccountReceivable.validateCurrencyConsistency(amount, this.props.currencyCode);

    this.props.paidAmount     = this.props.paidAmount.add(amount);
    this.props.pendingBalance = this.props.pendingBalance.subtract(amount);
    this.props.updatedAt      = new Date();

    this.props.status = this.props.pendingBalance.isZero()
      ? AccountReceivableStatus.PAGADO
      : AccountReceivableStatus.PARCIAL;
  }

  checkExpiration(): void {
    if (!this.isOpen()) return;

    if (new Date() > this.props.dueDate) {
      this.props.status    = AccountReceivableStatus.VENCIDO;
      this.props.updatedAt = new Date();
    }
  }

  cancel(reason?: string): void {
    if (this.props.status === AccountReceivableStatus.PAGADO)
      throw new AccountReceivableDomainException(
        'cancel: cannot cancel an already paid account receivable',
      );

    if (this.props.status === AccountReceivableStatus.CANCELADO)
      throw new AccountReceivableDomainException(
        'cancel: account receivable is already cancelled',
      );

    this.props.status      = AccountReceivableStatus.CANCELADO;
    this.props.observation = reason
      ? `[CANCELADO] ${reason}`
      : this.props.observation;
    this.props.updatedAt   = new Date();
  }

  updateDueDate(newDueDate: Date): void {
    this.assertIsOpen('updateDueDate');
    AccountReceivable.validateDueDate(newDueDate, this.props.issueDate);

    this.props.dueDate   = newDueDate;
    this.props.updatedAt = new Date();

    if (
      this.props.status === AccountReceivableStatus.VENCIDO &&
      newDueDate > new Date()
    ) {
      this.props.status = this.props.paidAmount.isZero()
        ? AccountReceivableStatus.PENDIENTE
        : AccountReceivableStatus.PARCIAL;
    }
  }

  updateObservation(text: string | null): void {
    if (text !== null && text.trim().length === 0)
      throw new AccountReceivableDomainException(
        'updateObservation: observation cannot be blank — use null to clear it',
      );
    this.props.observation = text;
    this.props.updatedAt   = new Date();
  }

  // ─────────────────────────────────────────────────────────────────
  // QUERIES DE ESTADO
  // ─────────────────────────────────────────────────────────────────

  isOpen(): boolean {
    return (
      this.props.status === AccountReceivableStatus.PENDIENTE ||
      this.props.status === AccountReceivableStatus.PARCIAL   ||
      this.props.status === AccountReceivableStatus.VENCIDO
    );
  }

  isPaid(): boolean      { return this.props.status === AccountReceivableStatus.PAGADO; }
  isCancelled(): boolean { return this.props.status === AccountReceivableStatus.CANCELADO; }
  isOverdue(): boolean   { return this.isOpen() && new Date() > this.props.dueDate; }
  isPartiallyPaid(): boolean { return this.props.status === AccountReceivableStatus.PARCIAL; }

  // ─────────────────────────────────────────────────────────────────
  // VALIDACIONES ESTÁTICAS PRIVADAS
  // ─────────────────────────────────────────────────────────────────

  private static validateSalesReceiptId(id: number): void {
    if (!id || !Number.isInteger(id) || id <= 0)
      throw new AccountReceivableDomainException(
        `salesReceiptId must be a positive integer (got ${id})`,
      );
  }

  private static validateUserRef(userRef: string): void {
    if (!userRef || userRef.trim().length === 0)
      throw new AccountReceivableDomainException(
        'userRef is required and cannot be blank',
      );
    if (userRef.length > 255)
      throw new AccountReceivableDomainException(
        `userRef exceeds max length of 255 chars (got ${userRef.length})`,
      );
  }

  private static validateTotalAmount(amount: Money): void {
    if (amount.isZero())
      throw new AccountReceivableDomainException(
        'totalAmount must be greater than zero',
      );
  }

  private static validateDueDate(dueDate: Date, issueDate?: Date): void {
    if (!(dueDate instanceof Date) || isNaN(dueDate.getTime()))
      throw new AccountReceivableDomainException('dueDate must be a valid Date');

    const reference = issueDate ?? new Date();
    const refDay    = new Date(reference); refDay.setHours(0, 0, 0, 0);
    const dueDay    = new Date(dueDate);   dueDay.setHours(0, 0, 0, 0);

    if (dueDay < refDay)
      throw new AccountReceivableDomainException(
        `dueDate cannot be in the past (got ${dueDate.toISOString()})`,
      );
  }

  private static validatePaymentTypeId(id: number): void {
    if (!id || !Number.isInteger(id) || id <= 0)
      throw new AccountReceivableDomainException(
        `paymentTypeId must be a positive integer (got ${id})`,
      );
  }

  private static validateCurrencyCode(code: string): void {
    if (!code || !/^[A-Z]{3}$/.test(code))
      throw new AccountReceivableDomainException(
        `currencyCode must be a 3-letter ISO 4217 code (got "${code}")`,
      );
  }

  private static validateCurrencyConsistency(money: Money, currencyCode: string): void {
    if (money.currencyCode !== currencyCode.toUpperCase())
      throw new AccountReceivableDomainException(
        `Currency mismatch: account is ${currencyCode}, payment is ${money.currencyCode}`,
      );
  }

  private assertIsOpen(operation: string): void {
    if (!this.isOpen())
      throw new AccountReceivableDomainException(
        `${operation}: account is closed (status: ${this.props.status})`,
      );
  }

  updatePaymentType(paymentTypeId: number): void {
  if (!paymentTypeId || !Number.isInteger(paymentTypeId) || paymentTypeId <= 0)
    throw new AccountReceivableDomainException(
      `updatePaymentType: paymentTypeId must be a positive integer (got ${paymentTypeId})`,
    );
  this.props.paymentTypeId = paymentTypeId;
  this.props.updatedAt     = new Date();
}
}