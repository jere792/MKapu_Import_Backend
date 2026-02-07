export interface ClaimResponseDto {
    claimId: number;
    receiptId: number;
    sellerId: string;
    reason: string;
    description: string;
    status: string;
    registeredAt: Date;
    resolvedAt: Date | null;
}