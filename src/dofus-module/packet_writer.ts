import { Dofus2Packet } from "./types";
import Dofus2Writer from "./writer";

export default class Dofus2PacketWriter {
    private readonly writer: Dofus2Writer = new Dofus2Writer();

    compute_len(length: number): 0 | 1 | 2 | 3 {
        return length > 65535 ? 3 : length > 255 ? 2 : length > 0 ? 1 : 0;
    }

    build(packet: Omit<Dofus2Packet, "header">) {
        const type_len = this.compute_len(packet.length);
        this.writer.writeUnsignedShort((packet.id << 2) | type_len);

        if (packet.instance_id) {
            this.writer.writeUnsignedInt(packet.instance_id);
        }
        switch (type_len) {
            case 0:
                return;
            case 1:
                this.writer.writeByte(packet.length);
                break;
            case 2:
                this.writer.writeShort(packet.length);
                break;
            case 3:
                const high = (packet.length >> 16) & 255;
                const low = packet.length & 65535;
                this.writer.writeByte(high);
                this.writer.writeShort(low);
                break;
        }
        this.writer.writeBytes(packet.data);
    }

    data(): Buffer {
        return this.writer.slice(0);
    }
}
