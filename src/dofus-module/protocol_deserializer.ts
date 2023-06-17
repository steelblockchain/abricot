import Dofus2Reader, { Dofus2PrimitiveReaderMethod } from "./reader";
import {
    Dofus2NetworkData,
    Dofus2NetworkIdentifier,
    Dofus2NetworkProtocolGetter,
    Dofus2NetworkProtocolMetadataField,
    Dofus2NetworkType,
} from "./types";
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

export default class Dofus2NetworkProtocolDeserializer extends Dofus2NetworkProtocol {
    static deserialize_field(
        reader: Dofus2Reader,
        field: Dofus2NetworkProtocolMetadataField,
        message_getter: Dofus2NetworkProtocolGetter,
        type_getter: Dofus2NetworkProtocolGetter
    ): number | string | boolean | Dofus2NetworkData | null | undefined {
        if (field.write_method) {
            return reader.dynamic_reader_call(
                writer_to_reader(field.write_method ?? "writeByte")
            );
        }

        if (field.write_false_if_null_method) {
            if (
                reader.dynamic_reader_call(
                    writer_to_reader(
                        field.write_false_if_null_method ?? "writeByte"
                    )
                ) === 0
            ) {
                return null;
            }
        }

        if (field.prefixed_by_type_id) {
            const id = reader.dynamic_reader_call(
                writer_to_reader(field.write_type_id_method ?? "writeByte")
            ) as number;
            return Dofus2NetworkProtocolDeserializer.deserialize(
                id,
                reader,
                "type",
                message_getter,
                type_getter
            );
        }

        return Dofus2NetworkProtocolDeserializer.deserialize(
            field.type,
            reader,
            "type",
            message_getter,
            type_getter
        );
    }

    static deserialize(
        identifier: Dofus2NetworkIdentifier,
        reader: Dofus2Reader,
        network_type: Dofus2NetworkType,
        message_getter: Dofus2NetworkProtocolGetter,
        type_getter: Dofus2NetworkProtocolGetter
    ): Dofus2NetworkData | undefined {
        const base_data =
            network_type === "message"
                ? Dofus2NetworkProtocol.get_message(identifier, message_getter)
                : Dofus2NetworkProtocol.get_type(identifier, type_getter);

        if (!base_data) {
            return undefined;
        }

        const result: Dofus2NetworkData = {
            __id__: base_data.protocolID,
            __name__: base_data.name,
        };

        if (base_data.super_serialize) {
            const { __id__, __name__, ...rest } =
                Dofus2NetworkProtocolDeserializer.deserialize(
                    base_data.super,
                    reader,
                    network_type,
                    message_getter,
                    type_getter
                ) ?? { __id__: 0, __name__: "" };
            Object.assign(result, rest);
        }

        const boolean_fields = base_data.fields
            .filter((field) => field.use_boolean_byte_wrapper)
            .sort(
                (f1, f2) =>
                    (f1.boolean_byte_wrapper_position ?? 0) -
                    (f2.boolean_byte_wrapper_position ?? 0)
            );

        let flag = 0;
        for (let field of boolean_fields) {
            const position = (field.boolean_byte_wrapper_position ?? 0) - 1;

            if (position % 8 === 0) {
                flag = reader.readByte();
            }

            result[field.name] = wrapper_get_flag(flag, position % 8);
        }

        const other_fields = base_data.fields
            .filter((field) => !field.use_boolean_byte_wrapper)
            .sort((f1, f2) => (f1.position ?? 0) - (f2.position ?? 0));

        for (let field of other_fields) {
            if (field.is_vector || field.type === "ByteArray") {
                const length =
                    field.constant_length ??
                    (reader.dynamic_reader_call(
                        writer_to_reader(
                            field.write_length_method ?? "writeByte"
                        )
                    ) as number);

                if (field.type === "ByteArray") {
                    result[field.name] = reader.readBytes(length);
                } else {
                    result[field.name] = [];
                    for (let i = 0; i < length; i++) {
                        result[field.name].push(
                            Dofus2NetworkProtocolDeserializer.deserialize_field(
                                reader,
                                field,
                                message_getter,
                                type_getter
                            )
                        );
                    }
                }
            } else {
                result[field.name] =
                    Dofus2NetworkProtocolDeserializer.deserialize_field(
                        reader,
                        field,
                        message_getter,
                        type_getter
                    );
            }
        }

        return result;
    }
}
