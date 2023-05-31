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
