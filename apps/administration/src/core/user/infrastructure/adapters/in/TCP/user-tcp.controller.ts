/* apps/administration/src/core/user/infrastructure/adapters/in/TCP/user-tcp.controller.ts */

import { Controller, Inject, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { IUserQueryPort } from '../../../../domain/ports/in/user-port-in';

type GetUserByIdPayload = {
  id_usuario: string | number;
};

@Controller()
export class UserTcpController {
  private readonly logger = new Logger(UserTcpController.name);

  constructor(
    @Inject('IUserQueryPort')
    private readonly userQueryPort: IUserQueryPort,
  ) {}

  @MessagePattern('get_user_by_id')
  async getUserById(@Payload() payload: GetUserByIdPayload) {
    const idStr = String(payload?.id_usuario ?? '').trim();

    this.logger.log(
      `📡 [TCP] get_user_by_id payload: ${JSON.stringify(payload)}`,
    );

    if (!idStr) {
      return { ok: false, message: 'id_usuario es obligatorio', data: null };
    }

    const id = Number(idStr);
    if (Number.isNaN(id)) {
      return { ok: false, message: 'id_usuario debe ser numérico', data: null };
    }

    const userDto = await this.userQueryPort.getUserById(id);

    if (!userDto) {
      return { ok: true, data: null };
    }

    return {
      ok: true,
      data: {
        id_usuario: userDto.id_usuario,
        usu_nom: userDto.usu_nom,
        ape_pat: userDto.ape_pat,
        ape_mat: userDto.ape_mat,
      },
    };
  }
}
