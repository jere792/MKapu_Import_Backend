import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LogisticsController } from './logistics.controller';
import { LogisticsService } from './logistics.service';

@Module({
  imports: [
    // Configuración de variables de entorno
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env', // Lee el .env de la raíz
    }),

    // Configuración dinámica de TypeORM para Logistics
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get('LOGISTICS_DB_HOST'),
        port: configService.get<number>('LOGISTICS_DB_PORT'),
        username: configService.get('LOGISTICS_DB_USERNAME'),
        password: configService.get('LOGISTICS_DB_PASSWORD'),
        database: configService.get('LOGISTICS_DB_DATABASE'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: configService.get<boolean>('LOGISTICS_DB_SYNCHRONIZE'),
        logging: configService.get<boolean>('LOGISTICS_DB_LOGGING'),
        timezone: 'Z',
      }),
      inject: [ConfigService],
    }),

    // Aquí puedes agregar otros módulos específicos de logistics
  ],
  controllers: [LogisticsController],
  providers: [LogisticsService],
})
export class LogisticsModule {}
