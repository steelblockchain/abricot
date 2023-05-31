import { join, dirname, resolve } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);

const SRC = join(resolve(dirname(__filename)));
const ROOT = join(SRC, "..");

export default {
    SRC,
    ROOT,
};
