import { Script, ScriptMessageHandler, Session, attach } from "frida";
import { SCRIPTS } from "./scripts";
import { SCRIPTS_TYPE } from "./types";

export default class Frida {
    protected readonly pid: number;
    protected session?: Session;
    protected readonly scripts: Record<string, Script>;

    constructor(pid: number) {
        this.pid = pid;
        this.scripts = {};
    }

    async load_pscript(
        name: keyof SCRIPTS_TYPE,
        message?: Record<string, any>,
        data?: Buffer,
        callback?: ScriptMessageHandler
    ): Promise<boolean> {
        return await this.load_script(
            name,
            SCRIPTS[name],
            message,
            data,
            callback
        );
    }

    async load_script(
        name: string,
        script: string,
        message?: Record<string, any>,
        data?: Buffer,
        callback?: ScriptMessageHandler
    ): Promise<boolean> {
        if (this.scripts[name]) {
            return false;
        }

        if (!this.session) {
            this.session = await attach(this.pid);
        }

        this.scripts[name] = await this.session.createScript(script);

        if (callback) {
            this.scripts[name].message.connect(callback);
        }

        await this.scripts[name].load();

        if (message) {
            this.scripts[name].post(message, data);
        }

        return true;
    }

    unload_script(name: string): boolean {
        if (!this.scripts[name]) {
            return false;
        }

        this.scripts[name].unload();
        return true;
    }
}
