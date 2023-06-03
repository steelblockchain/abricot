import { readFileSync } from "fs";
import { join } from "path";
import constants from "../constants";
import { SCRIPTS_TYPE } from "./types";

export const SCRIPTS: SCRIPTS_TYPE = {
    scan: readFileSync(
        join(constants.SRC, "mitm-module", "scripts", "scan.js")
    ).toString("utf8"),
    funcs: readFileSync(
        join(constants.SRC, "mitm-module", "scripts", "funcs.js")
    ).toString("utf8"),
};
