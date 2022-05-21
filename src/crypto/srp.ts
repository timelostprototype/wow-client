import { createHash, randomBytes } from "crypto";

export interface LogonChallengePacket {
  B: bigint;
  g: bigint;
  N: bigint;
  salt: bigint;
  status: number;
}

export interface SRPResult {
  key: Uint8Array;
  A: Buffer;
  M1: Buffer;
  M2: bigint;
}

export class SRP {
  static ZERO: bigint = BigInt(0);
  static ONE: bigint = BigInt(1);
  static TWO: bigint = BigInt(2);

  constructor(private account: string, private password: string) {}

  static arrayBufferReverseToInt = (arrayBuffer: ArrayBuffer) => {
    const hex = [];
    new Uint8Array(arrayBuffer).reverse().forEach((i) => {
      hex.push(("0" + i.toString(16)).slice(-2));
    });
    return BigInt(`0x${hex.join("")}`);
  };

  static padStartArrayBuffer = (
    arrayBuffer: ArrayBuffer,
    targetLength: number
  ): ArrayBuffer => {
    const u8 = new Uint8Array(arrayBuffer);
    if (u8.length < targetLength) {
      const tmp = new Uint8Array(targetLength);
      tmp.fill(0, 0, targetLength - u8.length);
      tmp.set(u8, targetLength - u8.length);
      return tmp;
    }
    return u8;
  };

  static hashPadded(
    targetLen: number,
    ...arrays: ArrayBuffer[]
  ): ArrayBufferLike {
    const arraysPadded = arrays.map((arrayBuffer) =>
      SRP.padStartArrayBuffer(arrayBuffer, targetLen)
    );
    return SRP.hash(...arraysPadded);
  }

  static hash(...arrays: ArrayBuffer[]): ArrayBufferLike {
    const length = arrays.reduce((p, c) => p + c.byteLength, 0);
    const target = new Uint8Array(length);
    for (let offset = 0, i = 0; i < arrays.length; i++) {
      target.set(new Uint8Array(arrays[i]), offset);
      offset += arrays[i].byteLength;
    }
    return createHash("sha1").update(target).digest().buffer;
  }

  static bigIntToArrayBuffer(n: bigint): ArrayBuffer {
    const hex = n.toString(16);
    const arrayBuffer = new ArrayBuffer(Math.ceil(hex.length / 2));
    const u8 = new Uint8Array(arrayBuffer);
    let offset = 0;
    // handle toString(16) not padding
    if (hex.length % 2 !== 0) {
      u8[0] = parseInt(hex[0], 16);
      offset = 1;
    }
    for (let i = 0; i < arrayBuffer.byteLength; i++) {
      u8[i + offset] = parseInt(
        hex.slice(2 * i + offset, 2 * i + 2 + offset),
        16
      );
    }
    return arrayBuffer;
  }

  static arrayBufferToBigInt(arrayBuffer: ArrayBuffer): bigint {
    const hex: string[] = [];
    // we can't use map here because map will return Uint8Array which will screw up the parsing below
    new Uint8Array(arrayBuffer).forEach((i) => {
      hex.push(("0" + i.toString(16)).slice(-2)); // i.toString(16) will transform 01 to 1, so we add it back on and slice takes the last two chars
    });
    return BigInt(`0x${hex.join("")}`);
  }

  static randomBigInt(numBytes: number = 16): bigint {
    return SRP.arrayBufferToBigInt(randomBytes(numBytes));
  }

  static modPow(x: bigint, pow: bigint, mod: bigint): bigint {
    let result: bigint = SRP.ONE;
    while (pow > SRP.ZERO) {
      if (pow % SRP.TWO == SRP.ONE) {
        result = (x * result) % mod;
        pow -= SRP.ONE;
      } else {
        x = (x * x) % mod;
        pow /= SRP.TWO;
      }
    }
    return result;
  }

  async calculate(packet: LogonChallengePacket): Promise<SRPResult> {
    const N_bits = packet.N.toString(2).length;
    const paddingLength = Math.trunc((N_bits + 7) / 8);

    const identityHash = SRP.hash(
      new TextEncoder().encode(this.account + ":" + this.password).buffer
    );

    const hash1 = SRP.hash(SRP.bigIntToArrayBuffer(packet.salt), identityHash);
    const x = SRP.arrayBufferReverseToInt(hash1);
    const a = SRP.randomBigInt(N_bits / 8);
    const A = SRP.modPow(packet.g, a, packet.N);

    const A_REV_INT = SRP.arrayBufferReverseToInt(SRP.bigIntToArrayBuffer(A));
    const B_REV_INT = SRP.arrayBufferReverseToInt(
      SRP.bigIntToArrayBuffer(packet.B)
    );

    const A_REV = SRP.bigIntToArrayBuffer(A_REV_INT);
    const hash2 = SRP.hashPadded(
      paddingLength,
      A_REV,
      SRP.bigIntToArrayBuffer(packet.B)
    );
    const u = SRP.arrayBufferReverseToInt(hash2);
    const exp = u * x + a;
    const tmp = (SRP.modPow(packet.g, x, packet.N) * BigInt(3)) % packet.N;
    const S_INT = SRP.modPow(B_REV_INT + packet.N - tmp, exp, packet.N);

    const S = new Uint8Array(
      SRP.bigIntToArrayBuffer(
        SRP.arrayBufferReverseToInt(SRP.bigIntToArrayBuffer(S_INT))
      )
    );
    const S1 = [];
    const S2 = [];
    for (let i = 0; i < 16; ++i) {
      S1[i] = S[i * 2];
      S2[i] = S[i * 2 + 1];
    }

    const S1h = new Uint8Array(SRP.hash(new Uint8Array(S1).buffer));
    const S2h = new Uint8Array(SRP.hash(new Uint8Array(S2).buffer));
    const K = new Uint8Array(40);
    for (let i = 0; i < 20; ++i) {
      K[i * 2] = S1h[i];
      K[i * 2 + 1] = S2h[i];
    }

    const usernameHash = SRP.hash(
      new TextEncoder().encode(this.account).buffer
    );
    const nHash = SRP.hash(
      SRP.bigIntToArrayBuffer(
        SRP.arrayBufferReverseToInt(SRP.bigIntToArrayBuffer(packet.N))
      )
    );
    const gHash = SRP.hash(
      SRP.bigIntToArrayBuffer(
        SRP.arrayBufferReverseToInt(SRP.bigIntToArrayBuffer(packet.g))
      )
    );
    const nHashArr = new Uint8Array(nHash);
    const gHashArr = new Uint8Array(gHash);

    const Ngh = [];
    for (let i = 0; i < 20; ++i) {
      Ngh[i] = nHashArr[i] ^ gHashArr[i];
    }

    const M1 = SRP.hash(
      new Uint8Array(Ngh).buffer,
      usernameHash,
      SRP.bigIntToArrayBuffer(packet.salt),
      A_REV,
      SRP.bigIntToArrayBuffer(packet.B),
      K.buffer
    );

    const M2 = SRP.hash(A_REV, M1, K.buffer);

    return {
      key: K,
      A: Buffer.from(A_REV),
      M1: Buffer.from(M1),
      M2: SRP.arrayBufferToBigInt(M2),
    };
  }
}
