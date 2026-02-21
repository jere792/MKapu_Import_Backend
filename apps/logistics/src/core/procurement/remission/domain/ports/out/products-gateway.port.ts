export interface ProductsGatewayPort {
  getProductsInfo(ids: string[]): Promise<any[]>;
}
