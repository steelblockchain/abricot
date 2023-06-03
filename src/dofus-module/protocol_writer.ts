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

export default class Dofus2NetworkProtocolWriter extends Dofus2NetworkProtocol {
    private readonly writer: Dofus2Writer;
    private readonly data: Dofus2NetworkData;

    constructor(
        writer: Dofus2Writer,
        data: Dofus2NetworkData,
        identifier: Dofus2NetworkIdentifier,
        network_type: Dofus2NetworkType,
        messages_getter: Dofus2NetworkProtocolGetter,
        types_getter: Dofus2NetworkProtocolGetter
    ) {
        super(identifier, network_type, messages_getter, types_getter);

        this.writer = writer;
        this.data = data;
    }

    write_element(
        field: Dofus2NetworkProtocolMetadataField,
        element:
            | number
            | string
            | boolean
            | Dofus2NetworkData
            | null
            | undefined
    ) {
        const metadata = this.get_type(field.type ?? "");

        if (!metadata) {
            this.writer.dynamic_writer_call(
                field.write_method ?? "writeByte",
                element as number | string | boolean
            );
            return;
        }

        if (field.write_false_if_null_method) {
            if (element === null || element === undefined) {
                this.writer.dynamic_writer_call(
                    field.write_method ?? "writeByte",
                    0
                );
                return;
            }
        }

        if (field.prefixed_by_type_id) {
            this.writer.dynamic_writer_call(
                field.write_method ?? "writeByte",
                (element as Dofus2NetworkData).__id__
            );

            const protocol = new Dofus2NetworkProtocolWriter(
                this.writer,
                element as Dofus2NetworkData,
                (element as Dofus2NetworkData).__id__,
                "type",
                this.messages_getter,
                this.types_getter
            );
            protocol.encode();
            return;
        }

        const protocol = new Dofus2NetworkProtocolWriter(
            this.writer,
            element as Dofus2NetworkData,
            field.type ?? "",
            "type",
            this.messages_getter,
            this.types_getter
        );
        protocol.encode();
    }

    encode() {
        const metadata = this.base_data();
        if (metadata?.super_serialize) {
            const super_protocol = new Dofus2NetworkProtocolWriter(
                this.writer,
                this.data,
                metadata.super,
                this.network_type,
                this.messages_getter,
                this.types_getter
            );
            super_protocol.encode();
        }

        const boolean_fields =
            metadata?.fields
                .filter((field) => field.use_boolean_byte_wrapper)
                .sort(
                    (f1, f2) =>
                        (f1.boolean_byte_wrapper_position ?? 0) -
                        (f2.boolean_byte_wrapper_position ?? 0)
                ) ?? [];

        const flags: Array<number> = [];
        for (let field of boolean_fields) {
            const position = (field.boolean_byte_wrapper_position ?? 0) - 1;
            flags[field.position ?? 0] = wrapper_set_flag(
                flags[field.position ?? 0],
                position % 8,
                this.data[field.name ?? ""]
            );
        }

        const other_fields =
            metadata?.fields
                .filter((field) => !field.use_boolean_byte_wrapper)
                .sort((f1, f2) => (f1.position ?? 0) - (f2.position ?? 0)) ??
            [];

        for (let field of other_fields) {
            if (field.is_vector || field.type === "ByteArray") {
                this.writer.dynamic_writer_call(
                    field.write_length_method ?? "writeByte",
                    field.constant_length ?? this.data[field.name ?? ""].length
                );

                if (field.type === "ByteArray") {
                    this.writer.writeBytes(this.data[field.name ?? ""]);
                } else {
                    for (let element of this.data[field.name ?? ""]) {
                        this.write_element(field, element);
                    }
                }
            } else {
                this.write_element(field, this.data[field.name ?? ""]);
            }
        }
    }

    buffer(): Buffer {
        return this.writer.slice(0);
    }
}
