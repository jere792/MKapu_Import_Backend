/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { HttpService } from '@nestjs/axios';
import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { catchError, firstValueFrom } from 'rxjs';

@Injectable()
export class SunatService {
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}
  private readonly API_TOKEN = this.configService.get<string>('SUNAT_TOKEN');

  async consultarRuc(ruc: string) {
    if (ruc.length !== 11) {
      throw new HttpException(
        'El RUC debe tener 11 dígitos',
        HttpStatus.BAD_REQUEST,
      );
    }
    const url = `https://api.decolecta.com/${ruc}`;

    try {
      const response = await firstValueFrom(
        this.httpService
          .get(url, {
            headers: {
              Authorization: `Bearer ${this.API_TOKEN}`,
            },
          })
          .pipe(
            catchError((error) => {
              throw new HttpException(
                'Error al consultar el RUC',
                HttpStatus.NOT_FOUND,
              );
            }),
          ),
      );

      return {
        ruc: response.data.numeroDocumento,
        razon_social: response.data.razonSocial,
        estado: response.data.estado,
        direccion: response.data.direccion,
        ubigeo: response.data.ubigeo,
      };
    } catch (error) {
      throw new HttpException(
        'RUC no encontrado o error en el servidor',
        HttpStatus.NOT_FOUND,
      );
    }
  }
}
