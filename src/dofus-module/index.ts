import Dofus2PacketReader from "./packet_reader";
import Dofus2PacketWriter from "./packet_writer";
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
import Dofus2Writer, {
    Dofus2PrimitiveWriterMethod,
    Dofus2WriterMethod,
} from "./writer";

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
    Dofus2WriterMethod,
    Dofus2PrimitiveReaderMethod,
    Dofus2PrimitiveWriterMethod,
};

export default {
    // class
    Dofus2PacketReader,
    Dofus2PacketWriter,
    Dofus2NetworkProtocol,
    Dofus2Reader,
    Dofus2Writer,
    // function
    wrapper_get_flag,
    wrapper_set_flag,
};
