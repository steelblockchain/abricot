import BaseModule from "app/module";
import { botofu_parser } from "./parser";
import Loader from "./loader";
import { mark_function } from "app/utils";
import constants from "../constants";
import { join } from "path";
import { platform } from "os";

export type BotofuModuleEvent = {
    onParsed: (params: ParseParams) => void;
};

export type ParseParams = {
    input: string;
    output: string;
    executable?: string;
    force?: boolean;
};

export type HasLoaderParams = {
    path: string;
};

export default class BotofuModule extends BaseModule<BotofuModuleEvent> {
    protected readonly loaders: Record<string, Loader>;

    constructor(config: Record<string, any>) {
        super(config);

        this.loaders = {};

        // add parse to api
        mark_function(this.parse, "ws_api");
        mark_function(this.has_loader, "ws_api");
    }

    parse(
        { executable, input, output, force }: ParseParams = {
            executable: "",
            input: "",
            output: "",
            force: false,
        }
    ) {
        if (this.loaders[output] && !force) {
            return;
        }
        const r = botofu_parser(
            executable ??
                join(
                    constants.ROOT,
                    "binaries",
                    platform() === "win32"
                        ? "botofu_protocol_parser_win.exe"
                        : "botofu_protocol_parser_linux"
                ),
            input,
            output
        );
        if (r) {
            this.emit("onParsed", { executable, input, output, force });

            this.loaders[output] = new Loader(output);
        }
    }

    has_loader({ path }: HasLoaderParams = { path: "" }): boolean {
        return path in this.loaders;
    }

    get_loader(output_path: string): Readonly<Loader> {
        return this.loaders[output_path];
    }

    import(): void {}
    dispose(): void {}
}
