/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Inject, Injectable } from '@nestjs/common';
import { PaymentPortsOut } from '../../../pay/domain/ports/out/payment-ports-out';

@Injectable()
export class CheckoutService {
  constructor(
    @Inject('PaymentPortsOut') private readonly paymentGateway: PaymentPortsOut,
  ) {}
  async executeCharge(orderData: any): Promise<any> {
    const paymentResult = await this.paymentGateway.createCharge(
      orderData.total,
      orderData.currency,
      orderData.token,
      orderData.email,
    );
    if (paymentResult.status !== 'success') {
      throw new Error('Pago fallido');
    }
  }
}
