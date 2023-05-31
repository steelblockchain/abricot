import { FilterStartWith } from "types";
import CustomStream from "./stream";

export type BufferWriteMethods = FilterStartWith<keyof Buffer, "write">;

class WriterStream extends CustomStream {
    dynamic_buffer_call(
        func_name: Exclude<BufferWriteMethods, "write">,
        value: number | bigint,
        offset: number,
        byteLength: number
    ): void {
        (
            this.buffer[func_name] as (
                value: number | bigint,
                offset?: number,
                byteLength?: number
            ) => void
        )(value, offset, byteLength);
        this.offset += byteLength;
    }

    write_int8(value: number) {
        this.dynamic_buffer_call("writeInt8", value, this.offset, 1);
    }

    write_uint8(value: number) {
        this.dynamic_buffer_call("writeUInt8", value, this.offset, 1);
    }

    write_int16(value: number) {
        this.dynamic_buffer_call(
            this.endian === "big" ? "writeInt16BE" : "writeInt16LE",
            value,
            this.offset,
            2
        );
    }
    write_uint16(value: number) {
        this.dynamic_buffer_call(
            this.endian === "big" ? "writeUInt16BE" : "writeUInt16LE",
            value,
            this.offset,
            2
        );
    }
    write_int32(value: number) {
        this.dynamic_buffer_call(
            this.endian === "big" ? "writeInt32BE" : "writeInt32LE",
            value,
            this.offset,
            4
        );
    }
    write_uint32(value: number) {
        this.dynamic_buffer_call(
            this.endian === "big" ? "writeUInt32BE" : "writeUInt32LE",
            value,
            this.offset,
            4
        );
    }
    write_int64(value: bigint) {
        this.dynamic_buffer_call(
            this.endian === "big" ? "writeBigInt64BE" : "writeBigInt64LE",
            value,
            this.offset,
            8
        );
    }
    write_uint64(value: bigint) {
        this.dynamic_buffer_call(
            this.endian === "big" ? "writeBigUInt64BE" : "writeBigUInt64LE",
            value,
            this.offset,
            8
        );
    }
    write_double(value: number) {
        this.dynamic_buffer_call(
            this.endian === "big" ? "writeDoubleBE" : "writeDoubleLE",
            value,
            this.offset,
            8
        );
    }
    write_float(value: number) {
        this.dynamic_buffer_call(
            this.endian === "big" ? "writeFloatBE" : "writeFloatLE",
            value,
            this.offset,
            4
        );
    }
    write_bytes(value: Buffer) {
        this.add(this.buffer, value.length);
        this.offset += value.length;
    }
    write_string(value: string) {
        this.write_uint16(value.length);
        this.write_bytes(Buffer.from(value, "utf8"));
    }
}

export class WriterBigEndianStream extends WriterStream {
    constructor() {
        super("big");
    }
}

export class WriterLittleEndianStream extends WriterStream {
    constructor() {
        super("little");
    }
}

export default WriterStream;
