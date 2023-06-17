import { Dofus2PrimitiveWriterMethod } from "./writer";

export type Dofus2PacketSide = "client" | "server";

export type Dofus2Packet = {
    header: number;
    id: number;

    instance_id?: number;
    data: Buffer;
    length: number;

    side: Dofus2PacketSide;
    timestamp: Date;
};

export type Dofus2NetworkType = "message" | "type";
export type Dofus2NetworkIdentifier = string | number;

export type Dofus2NetworkProtocolMetadataFieldLimit = {
    low?: number;
    up?: number;
};

export type Dofus2NetworkProtocolMetadataField = {
    boolean_byte_wrapper_position?: number;
    bounds?: Dofus2NetworkProtocolMetadataFieldLimit;
    constant_length?: number;
    default_value: string;
    is_vector: boolean;
    name: string;
    namespace: string;
    null_checked: boolean;
    position: number;
    prefixed_by_type_id: boolean;
    self_serialize_method?: string;
    type: string;
    type_namespace?: string;
    use_boolean_byte_wrapper: boolean;
    write_false_if_null_method?: Dofus2PrimitiveWriterMethod;
    write_length_method?: Dofus2PrimitiveWriterMethod;
    write_method?: Dofus2PrimitiveWriterMethod;
    write_type_id_method?: Dofus2PrimitiveWriterMethod;
};

export type Dofus2NetworkProtocolMetadata = {
    fields: Array<Dofus2NetworkProtocolMetadataField>;
    name: string;
    namespace: string;
    protocolID: number;
    super: string;
    super_serialize: boolean;
    supernamespace: string;
    use_hash_function: boolean;
};

export type Dofus2NetworkProtocolGetter = (
    identifier: Dofus2NetworkIdentifier
) => Dofus2NetworkProtocolMetadata | undefined;

export type Dofus2NetworkData = {
    __name__: string;
    __id__: number;
} & Record<string, any>;
