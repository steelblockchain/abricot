import NodeCache from "node-cache";
import {
    Dofus2NetworkIdentifier,
    Dofus2NetworkProtocolGetter,
    Dofus2NetworkProtocolMetadata,
} from "./types";

export default class Dofus2NetworkProtocol {
    protected static readonly cache: NodeCache = new NodeCache();

    static get_message(
        identifier: Dofus2NetworkIdentifier,
        message_getter: Dofus2NetworkProtocolGetter
    ): Dofus2NetworkProtocolMetadata | undefined {
        const key = `dofus.messages.${identifier}`;

        let message_cache: Dofus2NetworkProtocolMetadata | undefined =
            Dofus2NetworkProtocol.cache.get<Dofus2NetworkProtocolMetadata>(key);

        if (message_cache) {
            return message_cache;
        }

        message_cache = message_getter(identifier);
        Dofus2NetworkProtocol.cache.set(key, message_cache);

        return message_cache;
    }

    static get_type(
        identifier: Dofus2NetworkIdentifier,
        type_getter: Dofus2NetworkProtocolGetter
    ): Dofus2NetworkProtocolMetadata | undefined {
        const key = `dofus.types.${identifier}`;

        let type_cache: Dofus2NetworkProtocolMetadata | undefined =
            Dofus2NetworkProtocol.cache.get<Dofus2NetworkProtocolMetadata>(key);

        if (type_cache) {
            return type_cache;
        }

        type_cache = type_getter(identifier);
        Dofus2NetworkProtocol.cache.set(key, type_cache);

        return type_cache;
    }
}
