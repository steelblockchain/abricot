// @ts-nocheck
var connect_p = Module.getExportByName(null, "connect");
var send_p = Module.getExportByName(null, "send");
var recv_p = Module.getExportByName(null, "recv");

Interceptor.attach(connect_p, {
    onEnter: function (args) {
        this.connect_sockfd = args[0].toInt32();

        const sockaddr_p = args[1];
        this.sa_family = sockaddr_p.add(1).readU8();
        this.port =
            256 * sockaddr_p.add(2).readU8() + sockaddr_p.add(3).readU8();
        this.addr = "";
        for (var i = 0; i < 4; i++) {
            this.addr += sockaddr_p.add(4 + i).readU8(4);
            if (i < 3) this.addr += ".";
        }
    },
    onLeave: function (retval) {
        const host_address = Socket.localAddress(this.connect_sockfd);
        const message = {
            type: "connect",
            pid: Process.id,
            fd: this.connect_sockfd,
            host_ip: host_address.ip,
            host_port: host_address.port,
            target_ip: this.addr,
            target_port: this.port,
        };

        send(message);
    },
});

Interceptor.attach(send_p, {
    onEnter: function (args) {
        this.send_sockfd = args[0].toInt32();
        this.send_buf = args[1];
        this.send_len = args[2].toInt32();
    },
    onLeave: function (retval) {
        if (retval.toInt32() < 0) {
            return;
        }
        const socket_type = Socket.type(this.send_sockfd);
        const buffer = ptr(this.send_buf);

        if (socket_type === "tcp") {
            const host_address = Socket.localAddress(this.send_sockfd);
            const target_address = Socket.peerAddress(this.send_sockfd);

            const message = {
                type: "send",
                pid: Process.id,
                fd: this.send_sockfd,
                host_ip: host_address.ip,
                host_port: host_address.port,
                target_ip: target_address.ip,
                target_port: target_address.port,
                data_length: this.send_len,
            };

            const length = this.send_len;
            const bufferData = buffer.readByteArray(length);

            setImmediate(() => {
                send(message, bufferData);
            });
        }
    },
});

Interceptor.attach(recv_p, {
    onEnter: function (args) {
        this.recv_sockfd = args[0].toInt32();
        this.recv_buf = args[1];
    },
    onLeave: function (retval) {
        if (retval.toInt32() <= 0) {
            return;
        }
        const socket_type = Socket.type(this.recv_sockfd);
        const buffer = ptr(this.recv_buf);
        const length = retval.toInt32();

        if (socket_type === "tcp" && length > 0) {
            const host_address = Socket.localAddress(this.recv_sockfd);
            const target_address = Socket.peerAddress(this.recv_sockfd);

            const message = {
                type: "recv",
                pid: Process.id,
                fd: this.recv_sockfd,
                host_ip: host_address.ip,
                host_port: host_address.port,
                target_ip: target_address.ip,
                target_port: target_address.port,
                data_length: length,
            };

            const bufferData = buffer.readByteArray(length);

            setImmediate(() => {
                send(message, bufferData);
            });
        }
    },
});
