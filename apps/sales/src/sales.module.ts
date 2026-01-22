import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SalesController } from './sales.controller';
import { SalesService } from './sales.service';

@Module({
  imports: [
    // Configuración de variables de entorno
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env', // Lee el .env de la raíz
    }),

    // Configuración dinámica de TypeORM para Sales
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get('SALES_DB_HOST'),
        port: configService.get<number>('SALES_DB_PORT'),
        username: configService.get('SALES_DB_USERNAME'),
        password: configService.get('SALES_DB_PASSWORD'),
        database: configService.get('SALES_DB_DATABASE'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: configService.get<boolean>('SALES_DB_SYNCHRONIZE'),
        logging: configService.get<boolean>('SALES_DB_LOGGING'),
        timezone: 'Z',
      }),
      inject: [ConfigService],
    }),

    // Aquí puedes agregar otros módulos específicos de sales
  ],
  controllers: [SalesController],
  providers: [SalesService],
})
export class SalesModule {}
