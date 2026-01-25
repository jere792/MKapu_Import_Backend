export class RegisterIncomeItemDto {
  productId: number;
  warehouseId: number;
  quantity: number;
}
export class RegisterIncomeDto {
  refId: number;
  refTable: string;
  observation?: string;
  headquartersId: string;
  items: RegisterIncomeItemDto[];
}
