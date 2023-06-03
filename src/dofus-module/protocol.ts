import NodeCache from "node-cache";
import {
    Dofus2NetworkIdentifier,
    Dofus2NetworkProtocolGetter,
    Dofus2NetworkProtocolMetadata,
    Dofus2NetworkType,
} from "./types";

export default class Dofus2NetworkProtocol {
    static readonly cache: NodeCache = new NodeCache();

    protected readonly identifier: Dofus2NetworkIdentifier;
    protected readonly network_type: Dofus2NetworkType;
    protected readonly messages_getter: Dofus2NetworkProtocolGetter;
    protected readonly types_getter: Dofus2NetworkProtocolGetter;

    constructor(
        identifier: Dofus2NetworkIdentifier,
        network_type: Dofus2NetworkType,
        messages_getter: Dofus2NetworkProtocolGetter,
        types_getter: Dofus2NetworkProtocolGetter
    ) {
        this.identifier = identifier;
        this.network_type = network_type;

        this.messages_getter = messages_getter;
        this.types_getter = types_getter;
    }

    get_message(
        identifier: Dofus2NetworkIdentifier
    ): Dofus2NetworkProtocolMetadata | undefined {
        const key = `dofus.messages.${identifier}`;

        let message_cache: Dofus2NetworkProtocolMetadata | undefined =
            Dofus2NetworkProtocol.cache.get<Dofus2NetworkProtocolMetadata>(key);

        if (message_cache) {
            return message_cache;
        }

        message_cache = this.messages_getter(identifier);
        Dofus2NetworkProtocol.cache.set(key, message_cache);

        return message_cache;
    }

    get_type(
        identifier: Dofus2NetworkIdentifier
    ): Dofus2NetworkProtocolMetadata | undefined {
        const key = `dofus.types.${identifier}`;

        let type_cache: Dofus2NetworkProtocolMetadata | undefined =
            Dofus2NetworkProtocol.cache.get<Dofus2NetworkProtocolMetadata>(key);

        if (type_cache) {
            return type_cache;
        }

        type_cache = this.types_getter(identifier);
        Dofus2NetworkProtocol.cache.set(key, type_cache);

        return type_cache;
    }

    base_data(): Dofus2NetworkProtocolMetadata | undefined {
        switch (this.network_type) {
            case "message":
                return this.get_message(this.identifier);
            case "type":
                return this.get_type(this.identifier);
            default:
                throw new Error("required 'message' or 'type'");
        }
    }
}
