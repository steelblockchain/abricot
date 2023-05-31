import { ReaderBigEndianStream } from "io/reader";
import { FilterNotStartWith, FilterStartWith } from "types";

export type Dofus2ReaderMethod = FilterNotStartWith<
    FilterStartWith<keyof Dofus2Reader, "read">,
    "read_"
>;

export type Dofus2PrimitiveReaderMethod = Exclude<
    Dofus2ReaderMethod,
    "readBytes"
>;

export default class Dofus2Reader extends ReaderBigEndianStream {
    read_var(): number | bigint {
        let result = 0n;
        let byte_length = 0;
        for (let i = 0n; i < 64n; i += 7n) {
            const byte = BigInt(this.read_uint8());
            result += (byte & 127n) << i;
            byte_length += 1;
            if ((byte & 128n) === 0n) {
                return byte_length <= 4 ? Number(result) : result;
            }
        }

        throw new Error("too much data");
    }

    read_var_short(): number {
        return this.read_var() as number;
    }

    read_var_int(): number {
        return this.read_var() as number;
    }

    read_var_long(): bigint {
        return this.read_var() as bigint;
    }

    readVarInt(): number {
        return this.read_var_int();
    }
    readVarUhInt(): number {
        return this.readVarInt();
    }
    readVarShort(): number {
        return this.read_var_short();
    }
    readVarUhShort(): number {
        return this.readVarShort();
    }
    readVarLong(): bigint {
        return this.read_var_long();
    }
    readVarUhLong(): bigint {
        return this.readVarLong();
    }
    readBytes(length: number): Buffer {
        return this.read_bytes(length);
    }
    readBoolean(): boolean {
        return this.read_uint8() == 1;
    }
    readByte(): number {
        return this.read_int8();
    }
    readUnsignedByte(): number {
        return this.read_uint8();
    }
    readShort(): number {
        return this.read_int16();
    }
    readUnsignedShort(): number {
        return this.read_uint16();
    }
    readInt(): number {
        return this.read_int32();
    }
    readUnsignedInt(): number {
        return this.read_uint32();
    }
    readFloat(): number {
        return this.read_float();
    }
    readDouble(): number {
        return this.read_double();
    }
    readUTF(): string {
        return this.read_string();
    }
    dynamic_reader_call(
        func_name: Dofus2PrimitiveReaderMethod
    ): string | number | bigint | boolean {
        const result = this[func_name]();
        return result;
    }
}
