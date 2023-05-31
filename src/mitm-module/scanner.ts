import Frida from "./frida";
import { ErrorMessage, Message, SendMessage } from "frida";
import {
    ScannerConnectPayload,
    ScannerMessage,
    ScannerReceivePayload,
    ScannerSendPayload,
} from "./types";

export function is_send_message(message: Message): message is SendMessage {
    return message.type === "send";
}

export function is_error_message(message: Message): message is ErrorMessage {
    return message.type === "error";
}

export function is_connect_payload(
    message: SendMessage
): message is ScannerMessage<ScannerConnectPayload> {
    return message.payload.type === "connect";
}

export function is_send_payload(
    message: SendMessage
): message is ScannerMessage<ScannerSendPayload> {
    return message.payload.type === "send";
}

export function is_receive_payload(
    message: SendMessage
): message is ScannerMessage<ScannerReceivePayload> {
    return message.payload.type === "recv";
}

export default class Scanner {
    private readonly frida: Frida;

    constructor(pid: number) {
        this.frida = new Frida(pid);
    }

    async start(): Promise<boolean> {
        return await this.frida.load_pscript(
            "scan",
            undefined,
            undefined,
            (message, data) => {
                if (is_send_message(message)) {
                    if (is_connect_payload(message)) {
                        console.log("connect", message.payload.pid);
                    }
                    if (is_send_payload(message)) {
                        console.log(
                            "send",
                            message.payload.pid,
                            message.payload.target_port,
                            message.payload.target_ip
                        );
                    }
                    if (is_receive_payload(message)) {
                        console.log(
                            "recv",
                            message.payload.pid,
                            message.payload.target_port,
                            message.payload.target_ip
                        );
                    }
                }
                if (is_error_message(message)) {
                }
            }
        );
    }
}
