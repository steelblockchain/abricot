import { readFileSync } from "fs";
import { JSONPath } from "jsonpath-plus";

export default class Loader {
    private readonly protocol: Record<string, any>;

    constructor(protocol_path: string) {
        this.protocol = JSON.parse(
            readFileSync(protocol_path).toString("utf8")
        );
    }

    element_getter(
        protocol: "messages" | "types",
        identifier: string | number
    ): Array<Record<string, any>> {
        if (typeof identifier === "string") {
            return JSONPath({
                path: `$.${protocol}[?(@.name === "${identifier}")]`,
                json: this.protocol,
            });
        }
        if (typeof identifier === "number") {
            return JSONPath({
                path: `$.${protocol}[?(@.protocolID === ${identifier})]`,
                json: this.protocol,
            });
        }
        throw new Error("undefined identifier");
    }
}
