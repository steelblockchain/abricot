import { parse } from "yaml";
import { readFileSync } from "fs";
import template from "string-template";
import constants from "../constants";

export const load_config = (path: string): Record<string, any> => {
    const config = template(readFileSync(path).toString(), {
        src: constants.SRC,
        root: constants.ROOT,
    });
    return parse(config);
};
