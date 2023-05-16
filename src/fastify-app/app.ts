import BaseApp, { BaseAppModuleMap } from "app/base";
import BaseModule from "app/module";
import Fastify, { FastifyInstance } from "fastify";

export default class FastifyApp extends BaseApp {
    private fastify: FastifyInstance;

    constructor(modules: BaseAppModuleMap<BaseModule> = {}) {
        super(modules);

        this.fastify = Fastify({
            logger: false,
        });
    }

    async start(port: number) {
        await this.fastify.ready();

        await this.fastify.listen({
            port,
        });
    }
}
