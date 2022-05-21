import { Buffer } from "buffer";

export class IndexedBuffer {
  public index = 0;
  public buffer: Buffer = Buffer.alloc(0);

  constructor() {}

  get length() {
    return this.buffer.length;
  }

  get eof() {
    return this.index === this.buffer.length;
  }

  get available() {
    return this.buffer.length - this.index;
  }

  readUInt8() {
    return this.readStandard(this.buffer.readUint8, 1);
  }

  readUInt16LE() {
    return this.readStandard(this.buffer.readUInt16LE, 2);
  }

  readUInt16BE() {
    return this.readStandard(this.buffer.readUInt16BE, 2);
  }

  readUInt32LE() {
    return this.readStandard(this.buffer.readUInt32LE, 4);
  }

  readUInt32BE() {
    return this.readStandard(this.buffer.readUInt32BE, 4);
  }

  readFloatLE() {
    return this.readStandard(this.buffer.readFloatLE, 4);
  }

  readFloatBE() {
    return this.readStandard(this.buffer.readFloatBE, 4);
  }

  readBigInt(len: number, rev: boolean = true): bigint {
    let bytes = Array.from(this.readBytes(len))
      .map((b: number) => b.toString(16))
      .map((b: string) => (b.length % 2 ? "0" + b : b));
    bytes = rev ? bytes.reverse() : bytes;
    return BigInt("0x" + bytes.join(""));
  }

  readBytes(len: number): Buffer {
    if (len === 0) {
      return Buffer.alloc(0);
    } else if (len > 0) {
      if (this.index + len > this.buffer.length)
        throw new RangeError("Index out of range");
      let result = this.buffer.slice(this.index, this.index + len);
      this.index += len;
      return result;
    } else {
      if (this.index === this.buffer.length)
        throw new RangeError("Index out of range");
      let result = this.buffer.slice(this.index);
      this.index = this.buffer.length;
      return result;
    }
  }

  writeUInt8(val: number) {
    this.writeStandard(this.buffer.writeInt8, val, 1);
  }

  writeUInt16LE(val: number) {
    this.writeStandard(this.buffer.writeUInt16LE, val, 2);
  }

  writeUInt16BE(val: number) {
    this.writeStandard(this.buffer.writeUInt16BE, val, 2);
  }

  writeUInt32LE(val: number) {
    this.writeStandard(this.buffer.writeUInt32LE, val, 4);
  }

  writeUInt32BE(val: number) {
    this.writeStandard(this.buffer.writeUInt32BE, val, 4);
  }

  writeFloatLE(val: number) {
    this.writeStandard(this.buffer.writeFloatLE, val, 4);
  }

  writeFloatBE(val: number) {
    this.writeStandard(this.buffer.writeFloatBE, val, 4);
  }

  writeBytes(buffer: Buffer) {
    buffer.copy(this.buffer, this.index);
    this.index += buffer.length;
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

    this.writeBytes(Buffer.from(newArray));
  }

  appendBytes(buffer: Buffer) {
    if (!buffer || !buffer.length) {
      return;
    }
    const oldBuffer = this.buffer;
    this.buffer = Buffer.alloc(oldBuffer.length + buffer.length);
    oldBuffer.copy(this.buffer, 0);
    buffer.copy(this.buffer, oldBuffer.length);
  }

  readStandard(fn: (offset?: number) => number, length: number) {
    let result = fn.bind(this.buffer)(this.index);
    this.index += length;
    return result;
  }

  writeStandard(
    fn: (value: number, offset?: number) => number,
    value: number,
    length: number
  ) {
    fn.bind(this.buffer)(value, this.index);
    this.index += length;
  }

  clip() {
    const buffer = this.buffer.slice(this.index, this.buffer.length);
    this.index = 0;
    this.buffer = buffer;
  }

  clone(): Buffer {
    const data = Buffer.alloc(this.buffer.length);
    this.buffer.copy(data);
    return data;
  }
}
