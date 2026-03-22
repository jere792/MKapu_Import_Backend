import { Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { OnGatewayConnection, OnGatewayDisconnect, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { CreditNoteGatewayPayload, CreditNoteGatewayEventPayload } from './credit-note-websocket.payload';
@WebSocketGateway({
    namespace: '/credit-notes',
    cors: { origin: '*' },
})
export class CreditNoteWebsocketGateway implements OnGatewayConnection, OnGatewayDisconnect, OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(CreditNoteWebsocketGateway.name);

    @WebSocketServer()
    server: Server;

    onModuleInit(): void {
        this.logger.log('Gateway de notas de crédito inicializado');
    }

    onModuleDestroy(): void {
        this.logger.log('Gateway de notas de crédito detenido');
    }

    handleConnection(client: Socket): void {
        const headquartersId = String(
            client.handshake.query.headquartersId ?? '',
        ).trim();

        if (!headquartersId) {
            this.logger.warn(`Cliente ${ client.id } conectado sin headquartersId`);
            return;
        }

        void client.join(this.buildRoom(headquartersId));
        this.logger.debug(
            `Cliente ${ client.id } unido a room credit-notes de sede ${ headquartersId }`,
        );
    }

    handleDisconnect(client: Socket): void {
        this.logger.debug(`Cliente desconectado de credit-notes: ${ client.id }`);
    }

    notifyCreated(headquartersId: string, payload: CreditNoteGatewayPayload): void {
        this.emitToHeadquarters(headquartersId, 'credit_note_created', {
            message: `Nueva nota de crédito emitida: ${ payload.correlative }`,
            creditNote: payload,
            emittedAt: new Date().toISOString(),
        });
    }

    notifyAnnulled(headquartersId: string, payload: CreditNoteGatewayPayload): void {
        this.emitToHeadquarters(headquartersId, 'credit_note_annulled', {
            message: `Nota de crédito anulada: ${ payload.correlative }`,
            creditNote: payload,
            emittedAt: new Date().toISOString(),
        });
    }

    private emitToHeadquarters(headquartersId: string, event: string, payload: CreditNoteGatewayEventPayload): void {
        this.server.to(this.buildRoom(headquartersId)).emit(event, payload);
    }

    private buildRoom(headquartersId: string): string {
        return `sede_${ String(headquartersId).trim() }`;
    }
}