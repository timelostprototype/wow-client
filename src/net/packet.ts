import * as ByteBuffer from "byte-buffer";

export class Packet extends ByteBuffer {
  // Creates a new packet with given opcode from given source or length
  constructor(
    public opcode: number,
    source: any,
    public outgoing: boolean = true
  ) {
    super(source, ByteBuffer.LITTLE_ENDIAN);

    // Holds the opcode for this packet
    this.opcode = opcode;

    // Whether this packet is outgoing or incoming
    this.outgoing = outgoing;

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
    return this.length - this.headerSize;
  }

  // Retrieves the name of the opcode for this packet (if available)
  get opcodeName() {
    return null;
  }

  // Short string representation of this packet
  toString() {
    const opcode = ("0000" + this.opcode.toString(16).toUpperCase()).slice(-4);
    return `\u001b[2m[0x${opcode}] ${this.opcodeName || "UNKNOWN"};\t Length: ${
      this.length
    }; Body: ${this.bodySize}; Index: ${this._index}\u001b[22m`;
  }

  // Finalizes this packet
  finalize() {
    return this;
  }

  readRawString(): string {
    const bytes = [];
    while (bytes.indexOf(0) === -1) {
      bytes.push(this.readUnsignedByte());
    }
    bytes.pop();
    return bytes.map((x) => String.fromCharCode(x)).join("");
  }

  readBigInt(len: number, rev: boolean = true): bigint {
    let bytes = Array.from(this.read(len)._raw)
      .map((b: number) => b.toString(16))
      .map((b: string) => (b.length % 2 ? "0" + b : b));
    bytes = rev ? bytes.reverse() : bytes;
    return BigInt("0x" + bytes.join(""));
  }

  writeBigInt(bi: bigint, size: number = 32, rev: boolean = true): void {
    let hex = bi.toString(16);
    if (hex.length % 2) {
      hex = "0" + hex;
    }

    const len = hex.length / 2;
    const u8 = new Uint8Array(len);

    let i = 0;
    let j = 0;
    while (i < len) {
      u8[i] = parseInt(hex.slice(j, j + 2), 16);
      i += 1;
      j += 2;
    }

    const newArray = [];
    for (let i = 0; i < size; i++) {
      const readIdx = rev ? size - i : i;
      newArray[i] = u8[readIdx] || 0;
    }

    this.write(newArray);
  }

  writeRawString(str: string) {
    str.split("").forEach((x) => {
      this.writeUnsignedByte(x.charCodeAt(0));
    });
    this.writeUnsignedByte(0);
  }
}
