import { readFileSync } from "fs";
import { JSONPath, JSONPathClass } from "jsonpath-plus";

export default class Loader {
    protected readonly protocol: Record<string, any>;
    protected readonly json_path: JSONPathClass;

    constructor(protocol_path: string) {
        this.protocol = JSON.parse(
            readFileSync(protocol_path).toString("utf8")
        );

        this.json_path = JSONPath({
            json: this.protocol,
            path: "",
            autostart: false,
        });
    }

    element_getter(
        protocol: "messages" | "types",
        identifier: string | number
    ): Array<Record<string, any>> {
        if (typeof identifier === "string") {
            return this.json_path.evaluate(
                `$.${protocol}[?(@.name === "${identifier}")]`,
                null,
                undefined,
                undefined
            );
            /*return JSONPath({
                path: `$.${protocol}[?(@.name === "${identifier}")]`,
                json: this.protocol,
            });*/
        }
        if (typeof identifier === "number") {
            return this.json_path.evaluate(
                `$.${protocol}[?(@.protocolID === ${identifier})]`,
                null,
                undefined,
                undefined
            );
            /*return JSONPath({
                path: `$.${protocol}[?(@.protocolID === ${identifier})]`,
                json: this.protocol,
            });*/
        }
        throw new Error("undefined identifier");
    }
}
