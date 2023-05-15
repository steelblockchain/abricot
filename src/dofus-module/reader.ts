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
    readVarInt(): number {
        return this.read_var() as number;
    }
    readVarUhInt(): number {
        return this.readVarInt();
    }
    readVarShort(): number {
        return this.read_var() as number;
    }
    readVarUhShort(): number {
        return this.readVarShort();
    }
    readVarLong(): bigint {
        return this.read_var() as bigint;
    }
    readVarUhLong(): bigint {
        return this.read_var() as bigint;
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
        func_name: Exclude<Dofus2ReaderMethod, "readBytes">
    ): string | number | bigint | boolean | Buffer {
        const result = this[func_name]();
        return result;
    }
}
