export interface CommissionReportItem {
  sellerId: string;
  totalCommission: number;
  totalSales: number;
  details: {
    receiptId: number;
    receiptSerie: string;
    date: Date;
    items: {
      productName: string;
      quantity: number;
      commissionEarned: number;
      appliedRule: string;
    }[];
  }[];
}
