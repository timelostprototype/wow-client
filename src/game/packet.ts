import { Packet } from "../net/packet";
import { GameOpcode } from "./opcode";
import { GUID } from "./guid";

export class GamePacket extends Packet {
  // Header sizes in bytes for both incoming and outgoing packets
  static HEADER_SIZE_INCOMING = 4;
  static HEADER_SIZE_OUTGOING = 6;

  // Opcode sizes in bytes for both incoming and outgoing packets
  static OPCODE_SIZE_INCOMING = 2;
  static OPCODE_SIZE_OUTGOING = 4;

  constructor(opcode: GameOpcode, source?, outgoing = true) {
    if (!source) {
      source = outgoing
        ? GamePacket.HEADER_SIZE_OUTGOING
        : GamePacket.HEADER_SIZE_INCOMING;
    }
    super(opcode as number, source, outgoing);
  }

  // Retrieves the name of the opcode for this packet (if available)
  get opcodeName() {
    return GameOpcode.toString(this.opcode);
  }

  // Header size in bytes (dependent on packet origin)
  get headerSize() {
    if (this.outgoing) {
      //@ts-ignore
      return this.constructor.HEADER_SIZE_OUTGOING;
    }
    //@ts-ignore
    return this.constructor.HEADER_SIZE_INCOMING;
  }

  // Reads GUID from this packet
  readGUID() {
    return new GUID(this.read(GUID.LENGTH));
  }

  // Writes given GUID to this packet
  writeGUID(guid) {
    this.write(guid.raw);
    return this;
  }

  readPackedGUID() {
    const guidMark = this.readUnsignedByte();
    let guid = 0;
    for (let i = 0; i < 8; ++i) {
      if (guidMark & (1 << i)) {
        if (this.index + 1 > this.length) {
          throw "Buffer exception " + this.index + " >= " + this.length;
        }
        const bit = this.readUnsignedByte();
        guid |= bit << (i * 8);
      }
    }
    return guid;
  }
}
