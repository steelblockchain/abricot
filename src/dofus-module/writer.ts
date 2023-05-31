import { WriterBigEndianStream } from "io/writer";
import { FilterStartWith, FilterNotStartWith } from "types";

export type Dofus2WriterMethod = FilterNotStartWith<
    FilterStartWith<keyof Dofus2Writer, "write">,
    "write_"
>;

export type Dofus2PrimitiveWriterMethod = Exclude<
    Dofus2WriterMethod,
    "writeBytes"
>;

export default class Dofus2Writer extends WriterBigEndianStream {
    write_var(value: bigint) {
        let has_next = false;

        do {
            let byte = value & 0x7fn;
            value = value >> 7n;
            has_next = value > 0;

            if (has_next) {
                byte = byte | 0x80n;
            }
            this.writeByte(Number(byte));
        } while (has_next);
    }
    write_var_short(value: number) {
        this.write_var(BigInt(value));
    }
    write_var_int(value: number) {
        this.write_var(BigInt(value));
    }
    write_var_long(value: bigint) {
        this.write_var(value);
    }
    writeVarInt(value: number) {
        this.write_var(BigInt(value));
    }
    writeVarUhInt(value: number) {
        this.writeVarInt(value);
    }
    writeVarShort(value: number) {
        this.write_var(BigInt(value));
    }
    writeVarUhShort(value: number) {
        this.writeVarShort(value);
    }
    writeVarLong(value: bigint) {
        this.write_var(value);
    }
    writeVarUhLong(value: bigint) {
        this.writeVarLong(value);
    }
    writeBytes(value: Buffer) {
        this.write_bytes(value);
    }
    writeBoolean(value: boolean) {
        this.write_uint8(value ? 1 : 0);
    }
    writeByte(value: number) {
        this.write_int8(value);
    }
    writeUnsignedByte(value: number) {
        this.write_uint8(value);
    }
    writeShort(value: number) {
        this.write_int16(value);
    }
    writeUnsignedShort(value: number) {
        this.write_uint16(value);
    }
    writeInt(value: number) {
        this.write_int32(value);
    }
    writeUnsignedInt(value: number) {
        this.write_uint32(value);
    }
    writeFloat(value: number) {
        this.write_float(value);
    }
    writeDouble(value: number) {
        this.write_double(value);
    }
    writeUTF(value: string) {
        this.write_string(value);
    }

    dynamic_writer_call(
        func_name: Dofus2PrimitiveWriterMethod,
        value: bigint | number | string | boolean
    ) {
        (
            this[func_name] as (
                value: number | bigint | string | boolean
            ) => void
        )(value);
    }
}
