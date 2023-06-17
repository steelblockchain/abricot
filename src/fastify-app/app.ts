import BaseApp, { BaseAppModuleMap, BaseAppOptions } from "app/base";
import BaseModule from "app/module";
import Fastify, { FastifyInstance } from "fastify";
import FastifyWebsocket from "@fastify/websocket";

export const FASTIFY_DEFAULT_MODULE = "fastify-default-module";

export default class FastifyApp extends BaseApp {
    public readonly fastify: FastifyInstance;

    constructor(
        modules: BaseAppModuleMap<BaseModule> = {},
        options: BaseAppOptions = {},
        config: Record<string, any> | string = {}
    ) {
        super(modules, options, config);

        this.fastify = Fastify({
            logger: false,
        });

        this.fastify.register(FastifyWebsocket);
    }

    async start() {
        await this.fastify.ready();

        await this.fastify.listen({
            port: this.config.api?.port ?? 5000,
        });

        this.logger.log("info", `FastifyApp started`);
    }
}
