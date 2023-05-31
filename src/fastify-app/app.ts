import BaseApp, { BaseAppModuleMap, BaseAppOptions } from "app/base";
import BaseModule from "app/module";
import Fastify, { FastifyInstance } from "fastify";

export default class FastifyApp extends BaseApp {
    private fastify: FastifyInstance;

    constructor(
        modules: BaseAppModuleMap<BaseModule> = {},
        options: BaseAppOptions = {},
        config: Record<string, any>
    ) {
        super(modules, options, config);

        this.fastify = Fastify({
            logger: false,
        });
    }

    async start() {
        await this.fastify.ready();

        await this.fastify.listen({
            port: this.config.api?.port ?? 5000,
        });
    }
}
