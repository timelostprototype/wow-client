import { IndexedBuffer } from "./indexed-buffer";

export class Packet extends IndexedBuffer {
  // Creates a new packet with given opcode from given source or length
  constructor(
    public opcode: number,
    source: Buffer | number,
    public outgoing: boolean = true
  ) {
    super();
    if (typeof source === "number") {
      this.buffer = Buffer.alloc(source);
    } else {
      this.buffer = source;
    }
    // Seek past opcode to reserve space for it when finalizing
    this.index = this.headerSize;
  }

  // Header size in bytes
  get headerSize() {
    //@ts-ignore
    return this.constructor.HEADER_SIZE;
  }

  // Body size in bytes
  get bodySize() {
    return this.buffer.length - this.headerSize;
  }

  // Retrieves the name of the opcode for this packet (if available)
  get opcodeName() {
    return "";
  }

  // Short string representation of this packet
  toString() {
    const opcode = ("0000" + this.opcode.toString(16).toUpperCase()).slice(-4);
    return `\u001b[2m[0x${opcode}] ${this.opcodeName || "UNKNOWN"};\t Length: ${
      this.buffer.length
    }; Body: ${this.bodySize}; Index: ${this.index}\u001b[22m`;
  }

  // Finalizes this packet
  finalize() {
    return this;
  }
}
