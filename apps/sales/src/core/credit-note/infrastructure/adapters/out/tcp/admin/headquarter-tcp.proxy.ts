import { Inject, Injectable } from "@nestjs/common";
import { ClientProxy } from "@nestjs/microservices";
import { firstValueFrom } from "rxjs";

@Injectable()
export class HeadquarterTcpProxy {
    constructor(@Inject('ADMIN_SERVICE') private readonly client: ClientProxy) { }

    async getHeadquarterById(headquarterId: number) {
        const response: any = await firstValueFrom(this.client.send('get_sede_by_id', { id_sede: headquarterId }));
        
        return response?.data ?? null;
    }
}