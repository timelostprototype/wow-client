export class GUID {
  // GUID byte-length (64-bit)
  static LENGTH = 8;

  public low: number;
  public high: number;
  public raw: any;

  // Creates a new GUID
  constructor(public buffer: Buffer) {
    // Holds low-part
    this.low = buffer.readUint32LE();

    // Holds high-part
    this.high = buffer.readUint32LE(4);
  }

  // Short string representation of this GUID
  toString() {
    const high = ("0000" + this.high.toString(16)).slice(-4);
    const low = ("0000" + this.low.toString(16)).slice(-4);
    return `[GUID; Hex: 0x${high}${low}]`;
  }

  toNumber() {
    return this.low;
  }
}
