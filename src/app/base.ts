import BaseModule from "app/module.js";

export type BaseAppModuleMap<T extends BaseModule> = {
    [key: string]: T;
};

export default class BaseApp {
    private readonly modules: BaseAppModuleMap<BaseModule>;

    constructor(modules: BaseAppModuleMap<BaseModule> = {}) {
        this.modules = modules;
    }

    import_module<T extends BaseModule>(...modules: Array<[string, T]>): void {
        for (let [key, module] of modules) {
            if (this.modules[key]) {
                throw new Error(`key '${key}' is already taken`);
            }

            this.modules[key] = module;
        }
    }

    dispose_module(...modules: Array<string>): void {
        for (let module of modules) {
            if (!this.modules[module]) {
                throw new Error(`key '${module}' not found`);
            }
            delete this.modules[module];
        }
    }

    has_module(module: string): boolean {
        return module in this.modules;
    }
}
