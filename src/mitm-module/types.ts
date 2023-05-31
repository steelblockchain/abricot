import { SendMessage } from "frida";

export type SCRIPTS_TYPE = {
    scan: string;
};

export type ScannerType = "connect" | "send" | "recv";

export type ScannerPayload = {
    type: ScannerType;
    pid: number;
    fd: number;
};

export type ScannerConnectPayload = {
    target_ip: string;
    target_port: number;
} & ScannerPayload;

export type ScannerSendPayload = {
    host_ip: string;
    host_port: number;
    target_ip: string;
    target_port: number;
    data_length: number;
} & ScannerPayload;

export type ScannerReceivePayload = {
    host_ip: string;
    host_port: number;
    target_ip: string;
    target_port: number;
    data_length: number;
} & ScannerPayload;

export type ScannerMessage<
    T extends ScannerConnectPayload | ScannerSendPayload | ScannerReceivePayload
> = Omit<SendMessage, "payload"> & {
    payload: T;
};

export type ScannerConnectHandler = (payload: ScannerConnectPayload) => void;
export type ScannerPacketHandler<
    T extends ScannerSendPayload | ScannerReceivePayload
> = (payload: T, data: Buffer) => void;
