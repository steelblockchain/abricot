import { Message, Script, Session, attach } from "frida";
import { SCRIPTS } from "./scripts";
import { SCRIPTS_TYPE } from "./types";

export type FridaScriptMessageHandler = (
    script: Script,
    message: Message,
    data?: Buffer | null
) => void;

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
        callback?: FridaScriptMessageHandler
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
        callback?: FridaScriptMessageHandler
    ): Promise<boolean> {
        if (this.scripts[name]) {
            return false;
        }

        if (!this.session) {
            this.session = await attach(this.pid);
        }

        const session_script = await this.session.createScript(script);

        if (callback) {
            session_script.message.connect((message, data) => {
                callback(session_script, message, data);
            });
        }

        await session_script.load();

        if (message || data) {
            session_script.post(message, data);
        }

        this.scripts[name] = session_script;
        return true;
    }

    unload_script(name: keyof typeof this.scripts): boolean {
        if (!this.scripts[name]) {
            return false;
        }

        this.scripts[name].unload();
        return true;
    }

    get_script(name: keyof typeof this.scripts): Script {
        return this.scripts[name];
    }
}
