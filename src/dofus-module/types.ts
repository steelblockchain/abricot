import { Dofus2PrimitiveReaderMethod, Dofus2ReaderMethod } from "./reader";

export type Dofus2PacketSide = "client" | "server";

export interface Dofus2Packet {
    header: number;
    id: number;

    instance_id?: number;
    data: Buffer;
    length: number;

    side: Dofus2PacketSide;
    timestamp: Date;
}

export type Dofus2NetworkType = "message" | "type";
export type Dofus2NetworkIdentifier = string | number;

export type Dofus2NetworkProtocolMetadataField = {
    field_name: string;

    boolean_position?: number; // check if is a boolean wrapped value
    position: number;
    type: string;
    is_array: boolean;

    constant_length?: number; // check for constant length

    fixed_type_id?: number;
    nullable?: boolean;

    read_method?: Dofus2PrimitiveReaderMethod; // if primitive
    read_length_method?: Dofus2PrimitiveReaderMethod; // if array
    read_nullable_method?: Dofus2PrimitiveReaderMethod; // if nullable
    read_type_id_method?: Dofus2PrimitiveReaderMethod; // if fixed type id
};

export type Dofus2NetworkProtocolMetadata = {
    super?: Dofus2NetworkIdentifier;

    fields: Array<Dofus2NetworkProtocolMetadataField>;
    protocol_name: string;
    protocol_id: number;
};

export type Dofus2NetworkProtocolGetter = (
    identifier: Dofus2NetworkIdentifier
) => Dofus2NetworkProtocolMetadata | undefined;
