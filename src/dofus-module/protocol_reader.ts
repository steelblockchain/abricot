import {
    Dofus2NetworkData,
    Dofus2NetworkIdentifier,
    Dofus2NetworkProtocolGetter,
    Dofus2NetworkProtocolMetadataField,
    Dofus2NetworkType,
} from "./types";
import Dofus2Reader, { Dofus2PrimitiveReaderMethod } from "./reader";
import { Dofus2PrimitiveWriterMethod } from "./writer";
import Dofus2NetworkProtocol from "./protocol";

export function wrapper_get_flag(flag: number, offset: number): boolean {
    return (flag & (1 << offset)) !== 0;
}

export function writer_to_reader(
    writer: Dofus2PrimitiveWriterMethod
): Dofus2PrimitiveReaderMethod {
    return writer.replace("write", "read") as Dofus2PrimitiveReaderMethod;
}

export default class Dofus2NetworkProtocolReader extends Dofus2NetworkProtocol {
    private readonly reader: Dofus2Reader;

    constructor(
        reader: Dofus2Reader,
        identifier: Dofus2NetworkIdentifier,
        network_type: Dofus2NetworkType,
        messages_getter: Dofus2NetworkProtocolGetter,
        types_getter: Dofus2NetworkProtocolGetter
    ) {
        super(identifier, network_type, messages_getter, types_getter);
        this.reader = reader;
    }

    read_element(
        field: Dofus2NetworkProtocolMetadataField
    ): Dofus2NetworkData | string | number | boolean | null {
        const metadata = this.get_type(field.type ?? "");

        if (!metadata) {
            return this.reader.dynamic_reader_call(
                writer_to_reader(field.write_method ?? "writeByte")
            );
        }

        if (field.write_false_if_null_method) {
            if (
                this.reader.dynamic_reader_call(
                    writer_to_reader(
                        field.write_false_if_null_method ?? "writeByte"
                    )
                ) === 0
            ) {
                return null;
            }
        }

        if (field.prefixed_by_type_id) {
            const id = this.reader.dynamic_reader_call(
                writer_to_reader(field.write_type_id_method ?? "writeByte")
            ) as number;
            return new Dofus2NetworkProtocolReader(
                this.reader,
                id,
                "type",
                this.messages_getter,
                this.types_getter
            ).decode();
        }

        return new Dofus2NetworkProtocolReader(
            this.reader,
            field.type ?? "",
            "type",
            this.messages_getter,
            this.types_getter
        ).decode();
    }

    decode(): Dofus2NetworkData {
        const metadata = this.base_data();
        const result: Dofus2NetworkData = {
            __name__: metadata?.name ?? "",
            __id__: metadata?.protocolID ?? 0,
        };

        if (metadata?.super_serialize) {
            const super_protocol = new Dofus2NetworkProtocolReader(
                this.reader,
                metadata.super,
                this.network_type,
                this.messages_getter,
                this.types_getter
            );
            Object.assign(result, super_protocol.decode());
        }

        const boolean_fields =
            metadata?.fields
                .filter((field) => field.use_boolean_byte_wrapper)
                .sort(
                    (f1, f2) =>
                        (f1.boolean_byte_wrapper_position ?? 0) -
                        (f2.boolean_byte_wrapper_position ?? 0)
                ) ?? [];

        let flag = 0;
        for (let field of boolean_fields) {
            const position = (field.boolean_byte_wrapper_position ?? 0) - 1;

            if (position % 8 === 0) {
                flag = this.reader.readByte();
            }

            result[field.name ?? ""] = wrapper_get_flag(flag, position % 8);
        }

        const other_fields =
            metadata?.fields
                .filter((field) => !field.use_boolean_byte_wrapper)
                .sort((f1, f2) => (f1.position ?? 0) - (f2.position ?? 0)) ??
            [];

        for (let field of other_fields) {
            if (field.is_vector || field.type === "ByteArray") {
                const length =
                    field.constant_length ??
                    (this.reader.dynamic_reader_call(
                        writer_to_reader(
                            field.write_length_method ?? "writeByte"
                        )
                    ) as number);

                if (field.type === "ByteArray") {
                    result[field.name ?? ""] = this.reader.readBytes(length);
                } else {
                    result[field.name ?? ""] = [];
                    for (let i = 0; i < length; i++) {
                        result[field.name ?? ""].push(this.read_element(field));
                    }
                }
            } else {
                result[field.name ?? ""] = this.read_element(field);
            }
        }

        return result;
    }
}
