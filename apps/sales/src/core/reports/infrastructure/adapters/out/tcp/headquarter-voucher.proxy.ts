import { Inject, Injectable } from "@nestjs/common";
import { ClientProxy } from "@nestjs/microservices";
import { firstValueFrom } from "rxjs";

@Injectable()
export class HeadquarterVoucherProxy {
    
    constructor(
        @Inject('ADMIN_SERVICE')
        private readonly client: ClientProxy
    ) {}

    async getHeadquartersName(ids: number[]): Promise<Record<number, string>> {
        if (!ids || ids.length === 0) return {};
    try {
      return await firstValueFrom(
        this.client.send('get_sedes_nombres', ids)
      );
    } catch {
      return {};
    }
    }
}