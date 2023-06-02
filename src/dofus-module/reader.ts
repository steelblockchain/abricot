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

export type Number64 = {
    low: number;
    high: number;
};

export const number64_to_number = (num64: Number64): number => {
    return num64.high * 4294967296 + num64.low;
};

export default class Dofus2Reader extends ReaderBigEndianStream {
    static readonly MASK_10000000: number = 128;
    static readonly MASK_01111111: number = 127;

    static readonly CHUNCK_BIT_SIZE: number = 7;

    static readonly SHORT_SIZE: number = 16;
    static readonly INT_SIZE: number = 32;

    static readonly SHORT_MAX_VALUE: number = 32767;
    static readonly UNSIGNED_SHORT_MAX_VALUE: number = 65536;

    read_var_short(): number {
        let b: number = 0;
        let value: number = 0;
        let offset: number = 0;
        let hasNext: boolean = false;
        while (offset < Dofus2Reader.SHORT_SIZE) {
            b = this.readByte();
            hasNext =
                (b & Dofus2Reader.MASK_10000000) === Dofus2Reader.MASK_10000000;
            if (offset > 0) {
                value += (b & Dofus2Reader.MASK_01111111) << offset;
            } else {
                value += b & Dofus2Reader.MASK_01111111;
            }
            offset += Dofus2Reader.CHUNCK_BIT_SIZE;
            if (!hasNext) {
                if (value > Dofus2Reader.SHORT_MAX_VALUE) {
                    value -= Dofus2Reader.UNSIGNED_SHORT_MAX_VALUE;
                }
                return value;
            }
        }
        throw new Error("Too much data");
    }

    read_var_int(): number {
        let b: number = 0;
        let value: number = 0;
        let offset: number = 0;
        let hasNext: boolean = false;
        while (offset < Dofus2Reader.INT_SIZE) {
            b = this.readByte();
            hasNext =
                (b & Dofus2Reader.MASK_10000000) === Dofus2Reader.MASK_10000000;
            if (offset > 0) {
                value += (b & Dofus2Reader.MASK_01111111) << offset;
            } else {
                value += b & Dofus2Reader.MASK_01111111;
            }
            offset += Dofus2Reader.CHUNCK_BIT_SIZE;
            if (!hasNext) {
                return value;
            }
        }
        throw new Error("Too much data");
    }

    read_var_long(): number {
        var b: number = 0;
        var result: Number64 = { high: 0, low: 0 };
        var i: number = 0;
        while (true) {
            b = this.readUnsignedByte();
            if (i == 28) {
                break;
            }
            if (b < 128) {
                result.low |= b << i;
                return number64_to_number(result);
            }
            result.low |= (b & 127) << i;
            i += 7;
        }
        if (b >= 128) {
            b &= 127;
            result.low |= b << i;
            result.high = b >>> 4;
            i = 3;
            while (true) {
                b = this.readUnsignedByte();
                if (i < 32) {
                    if (b < 128) {
                        break;
                    }
                    result.high |= (b & 127) << i;
                }
                i += 7;
            }
            result.high |= b << i;
            return number64_to_number(result);
        }
        result.low |= b << i;
        result.high = b >>> 4;
        return number64_to_number(result);
    }

    read_var_ulong(): number {
        let b: number = 0;
        let result: Number64 = { high: 0, low: 0 };
        let i: number = 0;
        while (true) {
            b = this.readUnsignedByte();
            if (i == 28) {
                break;
            }
            if (b < 128) {
                result.low |= b << i;
                return number64_to_number(result);
            }
            result.low |= (b & 127) << i;
            i += 7;
        }
        if (b >= 128) {
            b &= 127;
            result.low |= b << i;
            result.high = b >>> 4;
            i = 3;
            while (true) {
                b = this.readUnsignedByte();
                if (i < 32) {
                    if (b < 128) {
                        break;
                    }
                    result.high |= (b & 127) << i;
                }
                i += 7;
            }
            result.high |= b << i;
            return number64_to_number(result);
        }
        result.low |= b << i;
        result.high = b >>> 4;
        return number64_to_number(result);
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
    readVarLong(): number {
        return this.read_var_long();
    }
    readVarUhLong(): number {
        return this.read_var_ulong();
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
        return Number(this.read_float().toFixed(4));
    }
    readDouble(): number {
        return Number(this.read_double().toFixed(8));
    }
    readUTF(): string {
        return this.read_string();
    }
    dynamic_reader_call(
        func_name: Dofus2PrimitiveReaderMethod
    ): string | number | boolean {
        const result = this[func_name]();
        return result;
    }
}
