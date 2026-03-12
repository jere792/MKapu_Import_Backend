import { RequestTransferDto } from '../dto/in/request-transfer.dto';

export class TransferRequestMapper {
  static withTransferMode(
    dto: RequestTransferDto,
    headerValue?: string,
  ): RequestTransferDto {
    return {
      ...dto,
      transferMode:
        dto.transferMode ?? this.normalizeTransferModeHeader(headerValue),
    };
  }

  private static normalizeTransferModeHeader(
    headerValue?: string,
  ): string | undefined {
    const normalizedHeader = String(headerValue ?? '')
      .trim()
      .toUpperCase();

    if (!normalizedHeader) {
      return undefined;
    }

    return normalizedHeader === 'AGGREGATED' ||
      normalizedHeader === 'SERIALIZED'
      ? normalizedHeader
      : undefined;
  }
}
