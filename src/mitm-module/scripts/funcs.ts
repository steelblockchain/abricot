// @ts-nocheck
const send_p = Module.getExportByName(null, "send");
const send_function = new NativeFunction(send_p, "int", [
    "int",
    "pointer",
    "int",
    "int",
]);

rpc.exports = {
    client_send(fd, data, length) {
        const data_ptr_str = Memory.alloc(length);
        const data_ptr = new NativePointer(data_ptr_str);
        data_ptr.writeByteArray(data.data);
        send_function(fd, data_ptr, length, 0);
    },
};
