/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  handleRequest(err: any, user: any, info: any) {
    if (info) {
      console.log('🚨 Motivo del rechazo de Passport:', info.message || info);
    }

    if (err || !user) {
      throw err || new UnauthorizedException('Token inválido o expirado');
    }

    return user;
  }
}
