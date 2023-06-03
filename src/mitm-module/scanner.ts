import { ErrorMessage } from "frida";
import Frida from "./frida";
import {
    ScannerConnectHandler,
    ScannerPacketHandler,
    ScannerReceivePayload,
    ScannerSendPayload,
} from "./types";
import {
    is_connect_payload,
    is_error_message,
    is_receive_payload,
    is_send_message,
    is_send_payload,
} from "./utils";

export default class Scanner {
    private readonly frida: Frida;

    private readonly on_connect: ScannerConnectHandler;
    private readonly on_recv: ScannerPacketHandler<ScannerSendPayload>;
    private readonly on_send: ScannerPacketHandler<ScannerReceivePayload>;
    private readonly on_error: (err: ErrorMessage) => void;

    constructor(
        pid: number,
        on_connect: ScannerConnectHandler,
        on_recv: ScannerPacketHandler<ScannerSendPayload>,
        on_send: ScannerPacketHandler<ScannerReceivePayload>,
        on_error: (err: ErrorMessage) => void
    ) {
        this.frida = new Frida(pid);
        this.on_connect = on_connect;
        this.on_recv = on_recv;
        this.on_send = on_send;
        this.on_error = on_error;
    }

    async start(): Promise<boolean> {
        return await this.frida.load_pscript(
            "scan",
            undefined,
            undefined,
            (script, message, data) => {
                if (is_send_message(message)) {
                    if (is_connect_payload(message)) {
                        this.on_connect(message.payload);
                    }
                    if (is_send_payload(message) && data) {
                        this.on_send(message.payload, data);
                    }
                    if (is_receive_payload(message) && data) {
                        this.on_recv(message.payload, data);
                    }
                }
                if (is_error_message(message)) {
                    this.on_error(message);
                }
            }
        );
    }
}
