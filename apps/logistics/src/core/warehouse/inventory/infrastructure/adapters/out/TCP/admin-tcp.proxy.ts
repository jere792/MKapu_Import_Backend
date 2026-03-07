/* eslint-disable @typescript-eslint/restrict-template-expressions */
import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class AdminTcpProxy {
  constructor(@Inject('ADMIN_SERVICE') private readonly client: ClientProxy) {}

  async getHeadquartersNames(ids: number[]): Promise<Record<number, string>> {
    try {
      return await firstValueFrom(this.client.send('get_sedes_nombres', ids));
    } catch (error) {
      console.error(`Error obteniendo sede ${ids} desde Admin:`, error);
      return null;
    }
  }
}
