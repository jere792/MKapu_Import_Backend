/* administration/src/administration.module.ts */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AdministrationController } from './administration.controller';
import { AdministrationService } from './administration.service';
import { UserModule } from './core/user/user.module';

@Module({
  imports: [
    // Configuración de variables de entorno
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env', // Lee el .env de la raíz
    }),

    // Configuración dinámica de TypeORM
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get('ADMIN_DB_HOST'),
        port: configService.get<number>('ADMIN_DB_PORT'),
        username: configService.get('ADMIN_DB_USERNAME'),
        password: configService.get('ADMIN_DB_PASSWORD'),
        database: configService.get('ADMIN_DB_DATABASE'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: configService.get<boolean>('ADMIN_DB_SYNCHRONIZE'),
        logging: configService.get<boolean>('ADMIN_DB_LOGGING'),
        timezone: 'Z',
      }),
      inject: [ConfigService],
    }),

    // Módulos de tu aplicación
    UserModule,
  ],
  controllers: [AdministrationController],
  providers: [AdministrationService],
})
export class AdministrationModule {}