import { ReaderBigEndianStream } from "io/reader";
import { FilterNotStartWith, FilterStartWith } from "types";
import {
    MASK_01111111,
    MASK_10000000,
    SHORT_SIZE,
    INT_SIZE,
    SHORT_MAX_VALUE,
    UNSIGNED_SHORT_MAX_VALUE,
    CHUNCK_BIT_SIZE,
} from "./constants";

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
    read_var_short(): number {
        let b: number = 0;
        let value: number = 0;
        let offset: number = 0;
        let hasNext: boolean = false;
        while (offset < SHORT_SIZE) {
            b = this.readByte();
            hasNext = (b & MASK_10000000) === MASK_10000000;
            if (offset > 0) {
                value += (b & MASK_01111111) << offset;
            } else {
                value += b & MASK_01111111;
            }
            offset += CHUNCK_BIT_SIZE;
            if (!hasNext) {
                if (value > SHORT_MAX_VALUE) {
                    value -= UNSIGNED_SHORT_MAX_VALUE;
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
        while (offset < INT_SIZE) {
            b = this.readByte();
            hasNext =
                (b & MASK_10000000) === MASK_10000000;
            if (offset > 0) {
                value += (b & MASK_01111111) << offset;
            } else {
                value += b & MASK_01111111;
            }
            offset += CHUNCK_BIT_SIZE;
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
