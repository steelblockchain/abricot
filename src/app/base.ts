import BaseModule from "app/module.js";
import winston from "winston";
import { load_config } from "./config";

export type BaseAppModuleMap<T extends BaseModule> = {
    [key: string]: T;
};

export type BaseAppOptions = {
    log_level?: string;
};
export type ModuleAnyParameters = Array<any>;
export type ModuleType<Module extends BaseModule> = {
    new (...args: ModuleAnyParameters): Module;
};

export default class BaseApp {
    public readonly logger: winston.Logger;
    protected readonly modules: BaseAppModuleMap<BaseModule>;
    protected readonly config: Record<string, any>;

    constructor(
        modules: BaseAppModuleMap<BaseModule> = {},
        options: BaseAppOptions = {},
        config: Record<string, any> | string = {}
    ) {
        this.modules = modules;
        this.logger = winston.createLogger({
            level: options.log_level,
            format: winston.format.simple(),
            transports: [new winston.transports.Console()],
        });
        if (typeof config === "string") {
            this.config = load_config(config);
        } else {
            this.config = config;
        }

        for (let module in this.modules) {
            this.modules[module].set_logger(this.logger);
            this.modules[module].import();
        }
    }

    import_module<Module extends BaseModule>(
        key: string,
        module: ModuleType<Module>,
        ...params: ModuleAnyParameters
    ): Module {
        if (this.modules[key]) {
            throw new Error(`key '${key}' is already taken`);
        }

        const module_instance = new module(this.config, ...params);
        module_instance.set_logger(this.logger);
        this.modules[key] = module_instance;
        this.modules[key].import();
        this.logger.log("info", `imported '${key}' module`);
        return module_instance;
    }

    dispose_module(...modules: Array<string>): void {
        for (let module of modules) {
            if (!this.modules[module]) {
                throw new Error(`module '${module}' not found`);
            }
            this.modules[module].dispose();
            delete this.modules[module];
        }
    }

    has_module<T extends BaseModule>(module: string): T | undefined {
        if (this.modules[module]) {
            return this.modules[module] as T;
        }
    }

    current_modules(): Array<string> {
        return Object.keys(this.modules);
    }
}
