import { Inject } from "@nestjs/common";
import { ConnectedSocket, MessageBody, OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { Server, Socket } from 'socket.io';
import { ITypeCreditNoteQueryPort } from "../../../domain/ports/in/type-credit-note-port-in";
import { TypeCreditResponseDto } from "../../../application/dto/out/type-credit-response-dto";

@WebSocketGateway({
    namespace: '/type-credit-note',
    cors: {
        origin: '*',
    },
})
export class TypeCreditNoteWebSocketGateway implements OnGatewayConnection, OnGatewayDisconnect{
    
    @WebSocketServer()
    server: Server;  

    constructor(
        @Inject('ITypeCreditNoteQueryPort')
        private readonly typeCreditNoteQueryService: ITypeCreditNoteQueryPort,
    ) {}

    handleConnection(client: Socket) {
        console.log(`Cliente conectado: ${client.id}`);
    }

    handleDisconnect(client: any) {
        console.log(`Cliente desconectado: ${client.id}`);
    }

    notifyTypeCreditNoteCreated(typeCreditNote: TypeCreditResponseDto): void {
        this.server.emit('typeCreditNoteCreated', typeCreditNote);
    }

    notifyTypeCreditNoteUpdated(typeCreditNote: TypeCreditResponseDto): void {
        this.server.emit('typeCreditNoteUpdated', typeCreditNote);
    }

    notifyTypeCreditNoteDeleted(id_tipo_nota_credito: number): void {
        this.server.emit('typeCreditNoteDeleted', { id_tipo_nota_credito });
    }

    notifyTypeCreditNoteStatusChanged(typeCreditNote: TypeCreditResponseDto): void {
        this.server.emit('typeCreditNoteStatusChanged', typeCreditNote);
    }

    @SubscribeMessage('listTypeCreditNotes')
    async handleListTypeCreditNotes(
        @MessageBody() filters: any,
        @ConnectedSocket() client: Socket
    ) {
        try {
            const result = await this.typeCreditNoteQueryService.listTypeCreditNotes(filters);
            client.emit('typeCreditNotesListed', result);
        } catch (error) {
            client.emit('typeCreditNotesListedError', error.message);
        }
    }

    @SubscribeMessage('getTypeCreditNoteById')
    async handleGetTypeCreditNoteById(
        @MessageBody() data: { id_tipo_nota_credito: number },
        @ConnectedSocket() client: Socket,
    ) {
        try {
            return await this.typeCreditNoteQueryService.getTypeCreditNoteById(data.id_tipo_nota_credito);
        } catch (error) {
            client.emit('getTypeCreditNoteByIdError', { event: 'getTypeCreditNoteById', message: error.message });
        }
    }
}