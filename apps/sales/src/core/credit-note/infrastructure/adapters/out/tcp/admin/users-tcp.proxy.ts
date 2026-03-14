import { Inject, Injectable } from "@nestjs/common";
import { ClientProxy } from "@nestjs/microservices";
import { firstValueFrom } from "rxjs";

@Injectable()
export class UserTcpProxy {
    constructor(@Inject('ADMIN_SERVICE') private readonly client: ClientProxy) { }

    async getUserById(userId: number) {
        const response: any = await firstValueFrom(this.client.send('users.findByIds', { ids: [userId], secret: process.env.INTERNAL_COMM_SECRET }));

        return response?.data?.[0] ?? null;
    }
} 