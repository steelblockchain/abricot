import Dofus2PacketAnalyzer from "./packet_reader";
import {
    Dofus2PacketSide,
    Dofus2NetworkType,
    Dofus2NetworkIdentifier,
    Dofus2NetworkProtocolGetter,
    Dofus2NetworkProtocolMetadata,
    Dofus2NetworkProtocolMetadataField,
    Dofus2Packet,
} from "dofus-module/types";
import Dofus2NetworkProtocol from "./protocol";
import { wrapper_get_flag } from "./protocol_reader";
import { wrapper_set_flag } from "./protocol_writer";
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
    wrapper_set_flag,
};
