/***
 *
 * THIS CODE IS JUST FOR TEST
 * EXAMPLE OF HOW TO IMPLEMENT A SCANNER ON DOFUS NETWORK
 *
 * TO DO: use BaseApp
 *
 */
import Scanner from "../dist/mitm-module/scanner.js";
import Dofus2PacketAnalyzer from "../dist/dofus-module/packet.js";
import Dofus2Reader from "../dist/dofus-module/reader.js";
import Dofus2NetworkProtocol from "../dist/dofus-module/protocol.js";

import { botofu_parser } from "../dist/botofu-module/parser.js";
import Loader from "../dist/botofu-module/loader.js";
import constants from "../dist/constants.js";

import { join } from "path";

const PID = parseInt(process.argv[2]);
const DOFUS_INVOKER = process.argv[3];

const output_path = join(constants.ROOT, "bin", "protocol.json");
botofu_parser(
    join(constants.ROOT, "binaries", "botofu_protocol_parser_win.exe"),
    DOFUS_INVOKER,
    output_path
);

const loader = new Loader(output_path);

const message_getter = (identifier) =>
    loader.element_getter("messages", identifier)[0];
const type_getter = (identifier) =>
    loader.element_getter("types", identifier)[0];

const main = async () => {
    const packet_analyzer_list = {};

    const scanner = new Scanner(
        PID, // process PID
        (payload) => {
            const key = `pid=${payload.pid}&fd=${payload.fd}&target=${payload.target_ip}:${payload.target_port}&host_port=${payload.host_port}`;

            packet_analyzer_list[key] = {
                send: new Dofus2PacketAnalyzer(),
                recv: new Dofus2PacketAnalyzer(),
            };
        },
        (payload, data) => {
            // receive (server) handler
            const key = `pid=${payload.pid}&fd=${payload.fd}&target=${payload.target_ip}:${payload.target_port}&host_port=${payload.host_port}`;
            if (!packet_analyzer_list[key]) {
                return;
            }
            const packets = packet_analyzer_list[key][payload.type].analyze(
                data,
                data.length,
                false
            );

            for (let packet of packets) {
                const reader = new Dofus2Reader();
                reader.add(packet.data, packet.data.length);
                try {
                    const protocol = new Dofus2NetworkProtocol(
                        reader,
                        packet.id,
                        "message",
                        message_getter,
                        type_getter
                    );
                    const message = protocol.decode();
                    console.log(
                        `[${packet.side}]`,
                        new Date(packet.timestamp),
                        message.__name__,
                        message.__id__
                    );
                } catch (e) {
                    console.error(`[${packet.side}]`, packet.id, e);
                }
            }
        },
        (payload, data) => {
            // send (client) handler
            const key = `pid=${payload.pid}&fd=${payload.fd}&target=${payload.target_ip}:${payload.target_port}&host_port=${payload.host_port}`;
            if (!packet_analyzer_list[key]) {
                return;
            }
            const packets = packet_analyzer_list[key][payload.type].analyze(
                data,
                data.length,
                true
            );

            for (let packet of packets) {
                const reader = new Dofus2Reader();
                reader.add(packet.data, packet.data.length);
                try {
                    const protocol = new Dofus2NetworkProtocol(
                        reader,
                        packet.id,
                        "message",
                        message_getter,
                        type_getter
                    );
                    const message = protocol.decode();
                    console.log(
                        `[${packet.side}]`,
                        new Date(packet.timestamp),
                        message.__name__,
                        message.__id__
                    );
                } catch (e) {
                    console.error(
                        `[${packet.side}]`,
                        new Date(packet.timestamp),
                        packet.id,
                        e
                    );
                }
            }
        },
        (error) => {
            console.error(error);
        }
    );
    await scanner.start();

    console.log("scanner started ...");
};

main();