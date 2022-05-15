declare class ByteBuffer {
  static LITTLE_ENDIAN: true;
  static BIG_ENDIAN: false;
  constructor(source: any, order?: boolean, implicitGrowth?: boolean);

  buffer: ArrayBuffer;
  _raw: Uint8Array;

  clip(): ByteBuffer;
  end(): ByteBuffer;
  append(bytes: number): ByteBuffer;
  seek(bytes: number): ByteBuffer;
  front(): ByteBuffer;

  read(input: any): ByteBuffer;
  readByte(): number;
  readUnsignedByte(): number;
  readShort(): number;
  readFloat(): number;
  readUnsignedShort(): number;
  readUnsignedInt(): number;
  readString(length: number): string;
  readCString(): string;
  readUnsignedShort(endian: boolean): number;

  write(input: any): void;
  writeByte(byte: number, endianness?: boolean): void;
  writeShort(short: number, endianness?: boolean): void;
  writeUnsignedByte(byte: number, endianness?: boolean): void;
  writeString(str: string): void;
  writeUnsignedInt(data: number): void;
  writeCString(str: string): void;

  public index: number;
  public _index: number;
  public available: number;
  public length: number;
}

declare module ByteBuffer {}
declare module "byte-buffer" {
  export = ByteBuffer;
}
