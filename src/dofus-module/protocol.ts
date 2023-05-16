import NodeCache from "node-cache";
import {
    Dofus2NetworkIdentifier,
    Dofus2NetworkProtocolGetter,
    Dofus2NetworkProtocolMetadata,
    Dofus2NetworkProtocolMetadataField,
    Dofus2NetworkType,
} from "./types";
import Dofus2Reader from "./reader";

export function wrapper_get_flag(flag: number, offset: number): boolean {
    return (flag & (1 << offset)) !== 0;
}

export default class Dofus2NetworkProtocol {
    static readonly cache: NodeCache = new NodeCache();

    private readonly reader: Dofus2Reader;
    private readonly identifier: Dofus2NetworkIdentifier;
    private readonly network_type: Dofus2NetworkType;

    private readonly messages_getter: Dofus2NetworkProtocolGetter; // to do
    private readonly types_getter: Dofus2NetworkProtocolGetter; // to do

    get_message(
        identifier: Dofus2NetworkIdentifier
    ): Dofus2NetworkProtocolMetadata | undefined {
        const key = `dofus.messages.${identifier}`;

        let message_cache: Dofus2NetworkProtocolMetadata | undefined =
            Dofus2NetworkProtocol.cache.get<Dofus2NetworkProtocolMetadata>(key);

        if (message_cache) {
            return message_cache;
        }

        message_cache = this.messages_getter(identifier);
        Dofus2NetworkProtocol.cache.set(key, message_cache);

        return message_cache;
    }

    get_type(
        identifier: Dofus2NetworkIdentifier
    ): Dofus2NetworkProtocolMetadata | undefined {
        const key = `dofus.types.${identifier}`;

        let type_cache: Dofus2NetworkProtocolMetadata | undefined =
            Dofus2NetworkProtocol.cache.get<Dofus2NetworkProtocolMetadata>(key);

        if (type_cache) {
            return type_cache;
        }

        type_cache = this.types_getter(identifier);
        Dofus2NetworkProtocol.cache.set(key, type_cache);

        return type_cache;
    }

    base_data(): Dofus2NetworkProtocolMetadata | undefined {
        switch (this.network_type) {
            case "message":
                return this.get_message(this.identifier);
            case "type":
                return this.get_type(this.identifier);
            default:
                throw new Error("required 'message' or 'type'");
        }
    }

    constructor(
        reader: Dofus2Reader,
        identifier: Dofus2NetworkIdentifier,
        network_type: Dofus2NetworkType,
        messages_getter: Dofus2NetworkProtocolGetter,
        types_getter: Dofus2NetworkProtocolGetter
    ) {
        this.reader = reader;

        this.identifier = identifier;
        this.network_type = network_type;

        this.messages_getter = messages_getter;
        this.types_getter = types_getter;
    }

    read_element(
        field: Dofus2NetworkProtocolMetadataField
    ): string | number | bigint | boolean | Record<string, any> | null {
        const metadata = this.get_type(field.type);

        if (!metadata) {
            return this.reader.dynamic_reader_call(
                field.read_method ?? "readByte"
            );
        }

        if (field.nullable) {
            if (
                this.reader.dynamic_reader_call(
                    field.read_nullable_method ?? "readByte"
                ) === 0
            ) {
                return null;
            }
        }

        if (field.fixed_type_id) {
            const id = this.reader.dynamic_reader_call(
                field.read_type_id_method ?? "readByte"
            );

            return new Dofus2NetworkProtocol(
                this.reader,
                id as string | number,
                "type",
                this.messages_getter,
                this.types_getter
            ).decode();
        }

        return new Dofus2NetworkProtocol(
            this.reader,
            metadata.protocol_name,
            "type",
            this.messages_getter,
            this.types_getter
        ).decode();
    }

    decode(): Record<string, any> {
        const result: Record<string, any> = {};
        const base_data = this.base_data();

        if (base_data?.super) {
            Object.assign(
                result,
                new Dofus2NetworkProtocol(
                    this.reader,
                    base_data.super,
                    this.network_type,
                    this.get_message,
                    this.get_type
                ).decode()
            );
        }

        const boolean_fields =
            base_data?.fields
                .filter((field) => field.boolean_position)
                .sort(
                    (f1, f2) =>
                        (f1.boolean_position ?? 0) - (f2.boolean_position ?? 0)
                ) ?? [];

        let flag = 0;
        for (let boolean_field of boolean_fields) {
            const boolean_position = boolean_field.boolean_position ?? 0;
            if (boolean_position % 8 === 0) {
                flag = this.reader.read_uint8();
            }
            result[boolean_field.field_name] = wrapper_get_flag(
                flag,
                boolean_position % 8
            );
        }

        const other_fields =
            base_data?.fields
                .filter((field) => !field.boolean_position)
                .sort((f1, f2) => (f1.position ?? 0) - (f2.position ?? 0)) ??
            [];

        for (let other_field of other_fields) {
            if (other_field.is_array || other_field.type === "ByteArray") {
                const length =
                    other_field.constant_length ??
                    (this.reader.dynamic_reader_call(
                        other_field.read_length_method ?? "readByte"
                    ) as number);

                if (other_field.type === "ByteArray") {
                    result[other_field.field_name] =
                        this.reader.readBytes(length);
                } else {
                    result[other_field.field_name] = [];
                    for (let _ in Array.from({ length })) {
                        result[other_field.field_name].push(
                            this.read_element(other_field)
                        );
                    }
                }
            } else {
                result[other_field.field_name] = this.read_element(other_field);
            }
        }

        return result;
    }
}
