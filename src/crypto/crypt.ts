import { createHmac, createCipheriv, createDecipheriv, Cipher } from "crypto";

export class Crypt {
  private encCipher: Cipher = null;
  private decCipher: Cipher = null;
  // Creates crypt
  constructor(key: Uint8Array) {
    console.info("initializing crypt");

    this.encCipher = createCipheriv(
      "rc4",
      Crypt.hashKey("C2B3723CC6AED9B5343C53EE2F4367CE", key),
      ""
    );

    this.decCipher = createDecipheriv(
      "rc4",
      Crypt.hashKey("CC98AE04E897EACA12DDC09342915357", key),
      ""
    );

    // Ensure the buffer is synchronized
    const syncData = new Uint8Array(1024);
    this.encCipher.update(syncData);
    this.decCipher.update(syncData);
  }

  encrypt(data: Uint8Array): Uint8Array {
    return this.encCipher.update(data);
  }

  decrypt(data: Uint8Array): Uint8Array {
    return this.decCipher.update(data);
  }

  static hashKey(key: string, dataKey: Uint8Array) {
    return createHmac("sha1", Buffer.from(key, "hex")).update(dataKey).digest();
  }
}
