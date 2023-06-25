/**
 *
 * THIS IS A BASIC EXAMPLE OF HOW TO USE ABRICOT APP
 *
 * This program is a simple FastifyWebsocket server.
 * This is just an example. You can modify it to have the client handle more things.
 *
 * init:
 *      node scripts/basic_mitm.js <DOFUS_INVOKER_PATH>
 * 
 */

import { join } from "path";
import {
    Fastify as fapp,
    MITM as mitm,
    Botofu as botofu,
    Dofus as dofus,
    constants,
} from "../dist/index.js"; // replace this by abricot

const wrap_result = (type, result) => {
    return {
        type,
        payload: result,
    };
};

const create_key = (p) => {
    return `fd=${p.fd}&pid=${p.pid}&targetip=${p.target_ip}&targetport=${p.target_port}&hostport=${p.host_port}`;
};

const main = async () => {
    const app = new fapp.FastifyApp(
        {},
        {},
        /**
         * use a string to locate your yaml file instead of hardcode config
         */
        {
            api: {
                port: 3000,
                ws: "/ws",
            }
        }
    );

    const fastify_module = app.import_module(
        "fastify-module",
        fapp.FastifyModule,
        app.fastify
    );
    const mitm_module = app.import_module("mitm-module", mitm.MITMModule);
    const botofu_module = app.import_module(
        "botofu-module",
        botofu.BotofuModule
    );
    const dofus_module = app.import_module(
        "dofus-module",
        dofus.DofusModule,
        (path) => botofu_module.get_loader(path)
    );

    fastify_module.addListener("onClientMessageJSON", (c, m) => {
        switch (m.type) {
            case "list":
                try {
                    const result = {};
                    const modules = app.current_modules();
                    for (const module_name of modules) {
                        const module = app.has_module(module_name);
                        if (module) {
                            result[module_name] = Object.getOwnPropertyNames(
                                Object.getPrototypeOf(module)
                            ).filter((key) => module[key]?.ws_api);
                        }
                    }
                    c.socket.send(
                        JSON.stringify(wrap_result("fastify:list", result))
                    );
                } catch (e) {
                    console.error(e);
                    c.socket.send(JSON.stringify({}));
                }
                break;
            case "module":
                const module = app.has_module(m.module);
                if (module) {
                    if (module[m.action] && module[m.action].ws_api) {
                        try {
                            const r = module[m.action](m.params ?? {});
                            c.socket.send(
                                JSON.stringify(
                                    wrap_result("fastify:module", {
                                        code: 0,
                                        module: m.module,
                                        action: m.action,
                                        params: m.params,
                                        result: r,
                                    })
                                )
                            );
                        } catch (e) {
                            console.error(e);
                            c.socket.send(
                                JSON.stringify(
                                    wrap_result("fastify:module", {
                                        code: 1,
                                        description: `func ${m.action} in module ${m.module}. ${e}`,
                                    })
                                )
                            );
                        }
                    } else {
                        c.socket.send(
                            JSON.stringify(
                                wrap_result("fastify:module", {
                                    code: 1,
                                    description: `func ${m.action} not found in module ${m.module}`,
                                })
                            )
                        );
                    }
                } else {
                    c.socket.send(
                        JSON.stringify(
                            wrap_result("fastify:module", {
                                code: 1,
                                description: `module ${m.module} not found`,
                            })
                        )
                    );
                }
                break;
            default:
                c.socket.send(
                    JSON.stringify(
                        wrap_result("fastify:module", {
                            code: 1,
                            description: `type ${m.type} not available`,
                        })
                    )
                );
                break;
        }
    });

    mitm_module.addListener("onScannerCreate", (s) => {
        botofu_module.parse({
            executable: join(
                constants.ROOT,
                "binaries",
                "botofu_protocol_parser_win.exe"
            ),
            input: process.argv[2],
            output: join(
                constants.ROOT,
                "bin",
                `protocol_${s.get_frida().get_pid()}.json`
            ),
        });
    });

    mitm_module.addListener("onScannerConnect", (s, p) => {
        dofus_module.create_analyzer({
            key: create_key(p),
            protocol: join(constants.ROOT, "bin", `protocol_${p.pid}.json`),
        });
    });

    mitm_module.addListener("onScannerSend", (s, p, b) => {
        dofus_module.push_and_decode({
            key: create_key(p),
            buffer: b,
            type: "send",
        });
    });

    mitm_module.addListener("onScannerRecv", (s, p, b) => {
        dofus_module.push_and_decode({
            key: create_key(p),
            buffer: b,
            type: "recv",
        });
    });

    dofus_module.addListener("onDofusMessage", (key, side, m) => {
        fastify_module.broadcast_data(
            wrap_result("dofus:message", {
                key,
                side,
                m,
            })
        );
    });

    await app.start();
};

main();
