/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

export interface ReniecDniResponse {
  nombres: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  nombreCompleto: string;
  tipoDocumento: 'DNI' | 'RUC';
  razonSocial?: string;
  estado?: string;
  condicion?: string;
  direccion?: string;
}

@Injectable()
export class ReniecService {
  private readonly logger = new Logger(ReniecService.name);

  constructor(private readonly httpService: HttpService) {}
  async consultar(numero: string): Promise<ReniecDniResponse> {
    if (/^\d{8}$/.test(numero)) return this.consultarDni(numero);
    if (/^\d{11}$/.test(numero)) return this.consultarRuc(numero);
    throw new HttpException(
      {
        message:
          'Número inválido. Debe ser DNI (8 dígitos) o RUC (11 dígitos).',
      },
      HttpStatus.BAD_REQUEST,
    );
  }
  private async consultarDni(dni: string): Promise<ReniecDniResponse> {
    const token = process.env['APISPERU_TOKEN'];
    this.logger.log(`Consultando DNI: ${dni}`);

    // Intento 1: apisperu.com con token
    if (token) {
      try {
        this.logger.log('DNI — intentando apisperu.com...');
        const { data } = await firstValueFrom(
          this.httpService.get(
            `https://dniruc.apisperu.com/api/v1/dni/${dni}?token=${token}`,
            { timeout: 8000, headers: { Accept: 'application/json' } },
          ),
        );
        this.logger.log(`apisperu DNI response: ${JSON.stringify(data)}`);
        if (data?.nombres) {
          return {
            tipoDocumento: 'DNI',
            nombres: data.nombres ?? '',
            apellidoPaterno: data.apellidoPaterno ?? '',
            apellidoMaterno: data.apellidoMaterno ?? '',
            nombreCompleto:
              `${data.nombres} ${data.apellidoPaterno} ${data.apellidoMaterno}`.trim(),
          };
        }
      } catch (err: any) {
        this.logger.warn(`apisperu DNI falló: ${err?.message}`);
      }
    }

    try {
      this.logger.log('DNI — intentando api.apis.pe...');
      const { data } = await firstValueFrom(
        this.httpService.get(`https://api.apis.pe/reniec/dni?numero=${dni}`, {
          timeout: 8000,
          headers: { Accept: 'application/json' },
        }),
      );
      this.logger.log(`api.apis.pe DNI response: ${JSON.stringify(data)}`);
      if (data?.nombres) {
        return {
          tipoDocumento: 'DNI',
          nombres: data.nombres ?? '',
          apellidoPaterno: data.apellidoPaterno ?? '',
          apellidoMaterno: data.apellidoMaterno ?? '',
          nombreCompleto:
            `${data.nombres} ${data.apellidoPaterno} ${data.apellidoMaterno}`.trim(),
        };
      }
    } catch (err: any) {
      this.logger.warn(`api.apis.pe DNI falló: ${err?.message}`);
    }

    try {
      this.logger.log('DNI — intentando apiperu.dev...');
      const { data } = await firstValueFrom(
        this.httpService.get(`https://apiperu.dev/api/dni/${dni}`, {
          timeout: 8000,
          headers: { Accept: 'application/json' },
        }),
      );
      this.logger.log(`apiperu.dev DNI response: ${JSON.stringify(data)}`);
      if (data?.data?.nombres) {
        return {
          tipoDocumento: 'DNI',
          nombres: data.data.nombres ?? '',
          apellidoPaterno: data.data.apellido_paterno ?? '',
          apellidoMaterno: data.data.apellido_materno ?? '',
          nombreCompleto:
            `${data.data.nombres} ${data.data.apellido_paterno} ${data.data.apellido_materno}`.trim(),
        };
      }
    } catch (err: any) {
      this.logger.warn(`apiperu.dev DNI falló: ${err?.message}`);
    }

    this.logger.error(`Todas las APIs DNI fallaron para: ${dni}`);
    throw new HttpException(
      { message: 'DNI no encontrado en RENIEC.' },
      HttpStatus.NOT_FOUND,
    );
  }
  private async consultarRuc(ruc: string): Promise<ReniecDniResponse> {
    const token = process.env['APISPERU_TOKEN'];
    this.logger.log(`Consultando RUC: ${ruc}`);

    if (token) {
      try {
        this.logger.log('RUC — intentando apisperu.com...');
        const { data } = await firstValueFrom(
          this.httpService.get(
            `https://dniruc.apisperu.com/api/v1/ruc/${ruc}?token=${token}`,
            { timeout: 8000, headers: { Accept: 'application/json' } },
          ),
        );
        this.logger.log(`apisperu RUC response: ${JSON.stringify(data)}`);
        if (data?.razonSocial) {
          return {
            tipoDocumento: 'RUC',
            nombres: data.razonSocial ?? '',
            apellidoPaterno: '',
            apellidoMaterno: '',
            nombreCompleto: data.razonSocial ?? '',
            razonSocial: data.razonSocial ?? '',
            estado: data.estado ?? '',
            condicion: data.condicion ?? '',
            direccion: data.direccion ?? '',
          };
        }
      } catch (err: any) {
        this.logger.warn(`apisperu RUC falló: ${err?.message}`);
      }
    }

    try {
      this.logger.log('RUC — intentando api.apis.pe...');
      const { data } = await firstValueFrom(
        this.httpService.get(`https://api.apis.pe/sunat/ruc?numero=${ruc}`, {
          timeout: 8000,
          headers: { Accept: 'application/json' },
        }),
      );
      this.logger.log(`api.apis.pe RUC response: ${JSON.stringify(data)}`);
      if (data?.razonSocial) {
        return {
          tipoDocumento: 'RUC',
          nombres: data.razonSocial ?? '',
          apellidoPaterno: '',
          apellidoMaterno: '',
          nombreCompleto: data.razonSocial ?? '',
          razonSocial: data.razonSocial ?? '',
          estado: data.estado ?? '',
          condicion: data.condicion ?? '',
          direccion: data.direccion ?? '',
        };
      }
    } catch (err: any) {
      this.logger.warn(`api.apis.pe RUC falló: ${err?.message}`);
    }

    try {
      this.logger.log('RUC — intentando apiperu.dev...');
      const { data } = await firstValueFrom(
        this.httpService.get(`https://apiperu.dev/api/ruc/${ruc}`, {
          timeout: 8000,
          headers: { Accept: 'application/json' },
        }),
      );
      this.logger.log(`apiperu.dev RUC response: ${JSON.stringify(data)}`);
      if (data?.data?.nombre_o_razon_social) {
        return {
          tipoDocumento: 'RUC',
          nombres: data.data.nombre_o_razon_social ?? '',
          apellidoPaterno: '',
          apellidoMaterno: '',
          nombreCompleto: data.data.nombre_o_razon_social ?? '',
          razonSocial: data.data.nombre_o_razon_social ?? '',
          estado: data.data.estado ?? '',
          condicion: data.data.condicion ?? '',
          direccion: data.data.direccion ?? '',
        };
      }
    } catch (err: any) {
      this.logger.warn(`apiperu.dev RUC falló: ${err?.message}`);
    }

    this.logger.error(`Todas las APIs RUC fallaron para: ${ruc}`);
    throw new HttpException(
      { message: 'RUC no encontrado en SUNAT.' },
      HttpStatus.NOT_FOUND,
    );
  }
}
