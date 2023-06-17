import { SocketStream } from "@fastify/websocket";
import BaseModule from "app/module";
import { FastifyInstance } from "fastify";

export type FastifyModuleEvent = {
    onClientConnected: (client: SocketStream) => void;
    onClientClosed: (client: SocketStream) => void;
    onClientMessage: (client: SocketStream, message: MessageEvent<any>) => void;

    onClientMessageJSON: (
        client: SocketStream,
        message: Record<string, any>
    ) => void;
    onClientMessageString: (client: SocketStream, message: string) => void;
};

export default class FastifyModule extends BaseModule<FastifyModuleEvent> {
    protected clients: Array<SocketStream>;

    constructor(config: Record<string, any>, fastify: FastifyInstance) {
        super(config);

        this.clients = [];

        fastify.register(async (app) => {
            app.get(
                config.api?.ws ?? "/ws",
                { websocket: true },
                (connection, req) => {
                    const client_ip = `ip=${req.socket.remoteAddress}&port=${req.socket.remotePort}`;
                    this.clients.push(connection);
                    this.emit("onClientConnected", connection);
                    this.get_logger().log(
                        "info",
                        `client connected ${client_ip}`
                    );
                    connection.socket.addEventListener("close", () => {
                        this.emit("onClientClosed", connection);
                        this.get_logger().log(
                            "info",
                            `client closed ${client_ip}`
                        );
                        this.clients = this.clients.filter(
                            (x) => x !== connection
                        );
                    });
                    connection.socket.addEventListener(
                        "message",
                        (message: MessageEvent<string>) => {
                            this.emit("onClientMessage", connection, message);

                            try {
                                const data = JSON.parse(message.data);

                                this.emit(
                                    "onClientMessageJSON",
                                    connection,
                                    data
                                );
                            } catch {
                                this.emit(
                                    "onClientMessageString",
                                    connection,
                                    message.data
                                );
                            }
                        }
                    );
                }
            );
        });
    }

    broadcast(buffer: string | ArrayBufferLike | Blob | ArrayBufferView) {
        for (const client of this.clients) {
            client.socket.send(buffer);
        }
    }

    broadcast_data(data: Record<string, any>) {
        return this.broadcast(JSON.stringify(data));
    }

    import(): void {}
    dispose(): void {
        for (const client of this.clients) {
            client.socket.close();
        }
        this.clients = [];
    }
}
