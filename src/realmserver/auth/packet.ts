import { AuthOpcode } from "./opcode";
import { Packet } from "../../common/net/packet";

export class AuthPacket extends Packet {
  // Header size in bytes for both incoming and outgoing packets
  static HEADER_SIZE = 1;

  constructor(opcode: AuthOpcode, source, outgoing = true) {
    super(opcode as number, source || AuthPacket.HEADER_SIZE, outgoing);
  }

  // Retrieves the name of the opcode for this packet (if available)
  get opcodeName() {
    return AuthOpcode.toString(this.opcode);
  }

  // Finalizes this packet
  finalize() {
    this.index = 0;
    this.writeUInt8(this.opcode);
    return this;
  }
}
