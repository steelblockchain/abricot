import Dofus2NetworkProtocol from "./protocol";
import {
    Dofus2NetworkData,
    Dofus2NetworkIdentifier,
    Dofus2NetworkProtocolGetter,
    Dofus2NetworkProtocolMetadataField,
    Dofus2NetworkType,
} from "./types";
import Dofus2Writer from "./writer";

export function wrapper_set_flag(
    flag: number | undefined,
    offset: number,
    value: boolean
) {
    flag = flag ?? 0;
    return value ? flag | (1 << offset) : flag & (255 - (1 << offset));
}

export default class Dofus2NetworkProtocolSerializer extends Dofus2NetworkProtocol {
    static serialize_field(
        field: Dofus2NetworkProtocolMetadataField,
        data: number | string | boolean | Dofus2NetworkData | null | undefined,
        message_getter: Dofus2NetworkProtocolGetter,
        type_getter: Dofus2NetworkProtocolGetter
    ): Buffer {
        const writer = new Dofus2Writer();

        if (field.write_method) {
            writer.dynamic_writer_call(
                field.write_method ?? "writeByte",
                data as string | number | boolean
            );
            return writer.slice(0);
        }

        if (
            field.write_false_if_null_method &&
            (data === null || data === undefined)
        ) {
            if (!data) {
                writer.dynamic_writer_call(
                    field.write_false_if_null_method ?? "writeByte",
                    0
                );
                return writer.slice(0);
            }
        }

        const network_data = data as Dofus2NetworkData;

        if (field.prefixed_by_type_id) {
            writer.dynamic_writer_call(
                field.write_type_id_method ?? "writeByte",
                network_data.__id__
            );
            return Buffer.concat([
                writer.slice(0),
                Dofus2NetworkProtocolSerializer.serialize(
                    network_data.__id__,
                    network_data,
                    "type",
                    message_getter,
                    type_getter
                ) ?? Buffer.alloc(0),
            ]);
        }

        return (
            Dofus2NetworkProtocolSerializer.serialize(
                field.type,
                network_data,
                "type",
                message_getter,
                type_getter
            ) ?? Buffer.alloc(0)
        );
    }

    static serialize(
        identifier: Dofus2NetworkIdentifier,
        data: Dofus2NetworkData,
        network_type: Dofus2NetworkType,
        message_getter: Dofus2NetworkProtocolGetter,
        type_getter: Dofus2NetworkProtocolGetter
    ): Buffer | undefined {
        const writer = new Dofus2Writer();
        const base_data =
            network_type === "message"
                ? Dofus2NetworkProtocol.get_message(identifier, message_getter)
                : Dofus2NetworkProtocol.get_type(identifier, type_getter);

        if (!base_data) {
            return undefined;
        }

        if (base_data.super_serialize) {
            const super_buffer = Dofus2NetworkProtocolSerializer.serialize(
                base_data.super,
                data,
                network_type,
                message_getter,
                type_getter
            );
            if (super_buffer) {
                writer.writeBytes(super_buffer);
            }
        }

        const boolean_fields = base_data.fields
            .filter((field) => field.use_boolean_byte_wrapper)
            .sort(
                (f1, f2) =>
                    (f1.boolean_byte_wrapper_position ?? 0) -
                    (f2.boolean_byte_wrapper_position ?? 0)
            );

        const flags: Array<number> = [];
        for (let field of boolean_fields) {
            const position = (field.boolean_byte_wrapper_position ?? 0) - 1;

            flags[field.position] = wrapper_set_flag(
                flags[field.position],
                position % 8,
                data[field.name]
            );
        }

        const other_fields = base_data.fields
            .filter((field) => !field.use_boolean_byte_wrapper)
            .sort((f1, f2) => (f1.position ?? 0) - (f2.position ?? 0));

        for (let field of other_fields) {
            if (field.is_vector || field.type === "ByteArray") {
                writer.dynamic_writer_call(
                    field.write_length_method ?? "writeByte",
                    field.constant_length ?? data[field.name].length
                );

                if (field.type === "ByteArray") {
                    writer.writeBytes(data[field.name]);
                } else {
                    for (let element of data[field.name]) {
                        writer.writeBytes(
                            Dofus2NetworkProtocolSerializer.serialize_field(
                                field,
                                element,
                                message_getter,
                                type_getter
                            )
                        );
                    }
                }
            } else {
                writer.writeBytes(
                    Dofus2NetworkProtocolSerializer.serialize_field(
                        field,
                        data[field.name],
                        message_getter,
                        type_getter
                    )
                );
            }
        }

        return writer.slice(0);
    }
}
