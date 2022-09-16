import { createHmac, createCipheriv, createDecipheriv, Cipher } from "crypto";

export class Arc4 {
  static ENCRYPTION_KEY = "C2B3723CC6AED9B5343C53EE2F4367CE";
  static DECRYPTION_KEY = "CC98AE04E897EACA12DDC09342915357";

  private encCipher: Cipher;
  private decCipher: Cipher;

  constructor(key: Uint8Array) {
    const encKey = Arc4.hashKey(Arc4.ENCRYPTION_KEY, key);
    const decKey = Arc4.hashKey(Arc4.DECRYPTION_KEY, key);

    this.encCipher = createCipheriv("rc4", encKey, "");
    this.decCipher = createDecipheriv("rc4", decKey, "");

    // Ensure the buffer is synchronized (Arc4-drop1024)
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
