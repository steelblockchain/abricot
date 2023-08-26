import BaseModule from "app/module";
import Dofus2PacketReader from "./packet_reader";
import { mark_function } from "app/utils";
import {
    Dofus2NetworkData,
    Dofus2NetworkProtocolMetadata,
    Dofus2NetworkType,
    Dofus2Packet,
    Dofus2PacketSide,
} from "./types";
import Dofus2Reader from "./reader";
import Dofus2NetworkProtocolDeserializer from "./protocol_deserializer";
import Dofus2Writer from "./writer";
import Dofus2NetworkProtocolSerializer from "./protocol_serializer";
import Dofus2PacketWriter from "./packet_writer";

export type DofusModuleEvent = {
    onAnalyzerCreate: (key: string) => void;
    onDofusPackets: (
        key: string,
        type: "send" | "recv",
        packets: Array<Dofus2Packet>
    ) => void;
    onDofusMessage: (
        key: string,
        side: Dofus2PacketSide,
        message: Dofus2NetworkData
    ) => void;
    onDofusAnalyzerMessage: (
        key: string,
        type: "send" | "recv",
        message: Dofus2NetworkData
    ) => void;
};

export type CreateAnalyzerParams = {
    protocol: string;
    key: string;
};
export type PushAnalyzerParams = {
    type: "send" | "recv";
    key: string;
    buffer: Buffer | { data: Array<number> };
};

export type PushAndDecodeParams = PushAnalyzerParams;

export type DecodeMessageParams = {
    protocol: string;
    identifier: string | number;
    buffer: Buffer | { data: Array<number> };
    type: Dofus2NetworkType;
    key: string;
    side: Dofus2PacketSide;
};

export type EncodeMessageParams = {
    key: string;
    identifier: string | number;
    instance_id?: number;
    data: Dofus2NetworkData;
    type: Dofus2NetworkType;
    side: Dofus2PacketSide;
};

export type ElementGetter = (
    protocol: "messages" | "types",
    identifier: string | number
) => Array<Dofus2NetworkProtocolMetadata>;
export type LoaderGetter = (output_path: string) => {
    element_getter: ElementGetter;
};

export default class DofusModule extends BaseModule<DofusModuleEvent> {
    protected readonly analyzers: Record<
        string,
        {
            protocol: string;
            send: Dofus2PacketReader;
            recv: Dofus2PacketReader;
        }
    >;

    protected readonly loader_getter: LoaderGetter;

    constructor(config: Record<string, any>, loader_getter: LoaderGetter) {
        super(config);

        this.analyzers = {};
        this.loader_getter = loader_getter;

        mark_function(this.create_analyzer, "ws_api");
        mark_function(this.push_analyzer, "ws_api");
        mark_function(this.decode_message, "ws_api");
        mark_function(this.encode_message, "ws_api");
        mark_function(this.push_and_decode, "ws_api");
    }

    create_analyzer(
        { key, protocol }: CreateAnalyzerParams = { key: "", protocol: "" }
    ) {
        this.analyzers[key] = {
            protocol,
            send: new Dofus2PacketReader(),
            recv: new Dofus2PacketReader(),
        };

        this.emit("onAnalyzerCreate", key);
    }

    push_analyzer(
        { key, buffer, type }: PushAnalyzerParams = {
            key: "",
            buffer: Buffer.from([]),
            type: "send",
        }
    ): Array<Dofus2Packet> {
        if (!this.analyzers[key]) {
            return [];
        }

        if ("data" in buffer) {
            buffer = Buffer.from(buffer.data);
        }

        const packets = this.analyzers[key][type].analyze(
            buffer,
            buffer.length,
            type === "send"
        );

        this.emit("onDofusPackets", key, type, packets);
        return packets;
    }

    decode_message(
        {
            protocol,
            buffer,
            identifier,
            type,
            key,
            side,
        }: DecodeMessageParams = {
            protocol: "",
            buffer: Buffer.from([]),
            identifier: "",
            type: "message",
            key: "",
            side: "client",
        }
    ) {
        const loader = this.loader_getter(protocol);
        if ("data" in buffer) {
            buffer = Buffer.from(buffer.data);
        }

        const message_getter = (identifier: string | number) =>
            loader.element_getter("messages", identifier).shift();

        const type_getter = (identifier: string | number) =>
            loader.element_getter("types", identifier).shift();

        const reader = new Dofus2Reader();
        reader.add(buffer, buffer.length);
        const data = Dofus2NetworkProtocolDeserializer.deserialize(
            identifier,
            reader,
            type,
            message_getter,
            type_getter
        );

        if (data) {
            this.emit("onDofusMessage", key, side, data);
        }
    }

    encode_message(
        {
            key,
            identifier,
            instance_id,
            data,
            type,
            side,
        }: EncodeMessageParams = {
            key: "",
            identifier: 0,
            data: { __id__: 0, __name__: "" },
            type: "message",
            side: "client",
        }
    ): Buffer {
        const protocol = this.analyzers[key].protocol;
        const loader = this.loader_getter(protocol);

        const message_getter = (identifier: string | number) =>
            loader.element_getter("messages", identifier).shift();

        const type_getter = (identifier: string | number) =>
            loader.element_getter("types", identifier).shift();

        const buffer = Dofus2NetworkProtocolSerializer.serialize(
            identifier,
            data,
            type,
            message_getter,
            type_getter
        );

        const packet = new Dofus2PacketWriter();
        if (buffer && type === "message") {
            const base = message_getter(identifier);

            packet.build({
                id: base?.protocolID ?? 0,
                instance_id: instance_id,
                side: side,
                data: buffer,
                length: buffer.length,
                timestamp: new Date(),
            });
        }

        return packet.data();
    }

    push_and_decode(
        { key, buffer, type }: PushAndDecodeParams = {
            key: "",
            buffer: Buffer.from([]),
            type: "send",
        }
    ) {
        const packets = this.push_analyzer({ key, buffer, type });
        if (key in this.analyzers) {
            const protocol = this.analyzers[key].protocol;
            for (const packet of packets) {
                this.decode_message({
                    protocol,
                    buffer: packet.data,
                    identifier: packet.id,
                    type: "message",
                    key,
                    side: packet.side,
                });
            }
        }
    }

    import(): void {}
    dispose(): void {}
}
