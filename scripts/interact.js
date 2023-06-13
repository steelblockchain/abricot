/**
 * to start:
 *
 * node interact.js <PID>
 *
 */
import { join } from "path";
import { readFileSync } from "fs";
import readline from "readline";

import constants from "../dist/constants.js";
import Loader from "../dist/botofu-module/loader.js";
import Frida from "../dist/mitm-module/frida.js";
import Dofus2Writer from "../dist/dofus-module/writer.js";
import Dofus2NetworkProtocolWriter from "../dist/dofus-module/protocol_writer.js";
import Dofus2PacketWriter from "../dist/dofus-module/packet_writer.js";

const PID = parseInt(process.argv[2]);

const protocol_path = join(constants.ROOT, "bin", "protocol.json");
const fd_path = join(constants.ROOT, "bin", `last_fd_${PID}`);

const loader = new Loader(protocol_path);
const message_getter = (identifier) =>
    loader.element_getter("messages", identifier)[0];
const type_getter = (identifier) =>
    loader.element_getter("types", identifier)[0];

const frida = new Frida(PID);
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

const init_interaction = (script) => {
    rl.question(">", (content) => {
        const packet = chat_packet(0, content);
        const FD = parseInt(readFileSync(fd_path, { encoding: "utf8" }));
        script.exports.client_send(FD, packet, packet.length);
        init_interaction(script);
    });
};

const packet_builder = (id, name, side, message) => {
    const writer = new Dofus2Writer();
    const protocol_writer = new Dofus2NetworkProtocolWriter(
        writer,
        {
            __name__: name,
            __id__: id,
            ...message,
        },
        name,
        "message",
        message_getter,
        type_getter
    );
    protocol_writer.encode();
    const data = protocol_writer.buffer();

    const packet_writer = new Dofus2PacketWriter();
    packet_writer.build({
        id,
        instance_id: Math.floor(Math.random() * 1000), // TO DO!!!
        data,
        length: data.length,
        side,
    });

    return packet_writer.data();
};

const chat_packet = (channel, content) => {
    return packet_builder(8474, "ChatClientMultiMessage", "client", {
        channel,
        content,
    });
};

const main = async () => {
    await frida.load_pscript("funcs");

    init_interaction(frida.get_script("funcs"));
};

main();
