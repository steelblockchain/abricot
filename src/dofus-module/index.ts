import Dofus2PacketAnalyzer from "dofus-module/packet";
import {
    Dofus2PacketSide,
    Dofus2NetworkType,
    Dofus2NetworkIdentifier,
    Dofus2NetworkProtocolGetter,
    Dofus2NetworkProtocolMetadata,
    Dofus2NetworkProtocolMetadataField,
    Dofus2Packet,
} from "dofus-module/types";
import Dofus2NetworkProtocol, { wrapper_get_flag } from "dofus-module/protocol";
import Dofus2Reader, {
    Dofus2PrimitiveReaderMethod,
    Dofus2ReaderMethod,
} from "./reader";

export {
    // types/interfaces
    Dofus2PacketSide,
    Dofus2NetworkType,
    Dofus2NetworkIdentifier,
    Dofus2NetworkProtocolGetter,
    Dofus2NetworkProtocolMetadata,
    Dofus2NetworkProtocolMetadataField,
    Dofus2Packet,
    Dofus2ReaderMethod,
    Dofus2PrimitiveReaderMethod,
};

export default {
    // class
    Dofus2PacketAnalyzer,
    Dofus2NetworkProtocol,
    Dofus2Reader,
    // function
    wrapper_get_flag,
};
