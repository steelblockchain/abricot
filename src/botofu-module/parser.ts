import { execFileSync } from "child_process";
import { existsSync, mkdirSync } from "fs";
import { dirname } from "path";

export const botofu_parser = async (
    executable_path: string,
    dofus_invoker_path: string,
    json_output_path: string
) => {
    if (!existsSync(executable_path)) {
        throw new Error("botofu executable not found");
    }

    if (!existsSync(dofus_invoker_path)) {
        throw new Error("DofusInvoker.swf not found");
    }

    const output_folder = dirname(json_output_path);

    if (!existsSync(output_folder)) {
        mkdirSync(output_folder);
    }

    return execFileSync(executable_path, [
        "--indent",
        "1",
        dofus_invoker_path,
        json_output_path,
    ]);
};
