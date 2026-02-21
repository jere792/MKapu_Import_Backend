import { SaleValidatedDto } from '../../../infrastructure/adapters/out/sales-gateway';

export interface SalesGatewayPortOut {
  getValidSaleForDispatch(saleId: number): Promise<SaleValidatedDto>;
  markAsDispatched(saleId: number): Promise<void>;
}
