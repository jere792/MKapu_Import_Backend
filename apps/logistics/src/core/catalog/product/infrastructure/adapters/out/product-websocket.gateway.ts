import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable } from '@nestjs/common';
import { ProductResponseDto } from '../../../application/dto/out';

@WebSocketGateway({
  namespace: '/products', 
  cors: {
    origin: '*',
  },
})
@Injectable()
export class ProductWebSocketGateway implements OnGatewayConnection {
  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    console.log(`📦 Cliente conectado a Logistics (Products): ${client.id}`);
    
    this.server.emit('product.created', {
      id_producto: 0,
      codigo: 'SYS-LOG',
      descripcion: 'Conexión a Logistics Exitosa',
      mensaje: 'Escuchando cambios en inventario (Balanzas, Parrillas, etc.)'
    });
  }

  productCreated(product: ProductResponseDto) {
    this.server.emit('product.created', product);
  }

  productUpdated(product: ProductResponseDto) {
    this.server.emit('product.updated', product);
  }

  productDeleted(id: number) {
    this.server.emit('product.deleted', { id });
  }
}