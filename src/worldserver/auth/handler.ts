import { GamePacket } from "../packet";
import { WorldServer } from "../worldserver";
import { randomBytes, createHash } from "crypto";
import { GameOpcode } from "../opcode";

export class WorldAuthHandler {
  constructor(private worldServer: WorldServer) {}

  async authenticate(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.worldServer.once(
        "packet:receive:SMSG_AUTH_CHALLENGE",
        (gp: GamePacket) => {
          gp.readUInt32LE(); // (0x01)

          const account = this.worldServer.config.account;

          const salt = gp.readBytes(4);
          const seed = randomBytes(4);

          const hash = createHash("sha1");

          hash.update(account);
          hash.update(new Uint8Array(4));
          hash.update(seed);
          hash.update(salt);
          hash.update(this.worldServer.key!);
          const digest = hash.digest();

          const build = this.worldServer.clientConfig.build;

          const addonInfo = [
            0x56, 0x01, 0x00, 0x00, 0x78, 0x9c, 0x75, 0xcc, 0xbd, 0x0e, 0xc2,
            0x30, 0x0c, 0x04, 0xe0, 0xf2, 0x1e, 0xbc, 0x0c, 0x61, 0x40, 0x95,
            0xc8, 0x42, 0xc3, 0x8c, 0x4c, 0xe2, 0x22, 0x0b, 0xc7, 0xa9, 0x8c,
            0xcb, 0x4f, 0x9f, 0x1e, 0x16, 0x24, 0x06, 0x73, 0xeb, 0x77, 0x77,
            0x81, 0x69, 0x59, 0x40, 0xcb, 0x69, 0x33, 0x67, 0xa3, 0x26, 0xc7,
            0xbe, 0x5b, 0xd5, 0xc7, 0x7a, 0xdf, 0x7d, 0x12, 0xbe, 0x16, 0xc0,
            0x8c, 0x71, 0x24, 0xe4, 0x12, 0x49, 0xa8, 0xc2, 0xe4, 0x95, 0x48,
            0x0a, 0xc9, 0xc5, 0x3d, 0xd8, 0xb6, 0x7a, 0x06, 0x4b, 0xf8, 0x34,
            0x0f, 0x15, 0x46, 0x73, 0x67, 0xbb, 0x38, 0xcc, 0x7a, 0xc7, 0x97,
            0x8b, 0xbd, 0xdc, 0x26, 0xcc, 0xfe, 0x30, 0x42, 0xd6, 0xe6, 0xca,
            0x01, 0xa8, 0xb8, 0x90, 0x80, 0x51, 0xfc, 0xb7, 0xa4, 0x50, 0x70,
            0xb8, 0x12, 0xf3, 0x3f, 0x26, 0x41, 0xfd, 0xb5, 0x37, 0x90, 0x19,
            0x66, 0x8f,
          ];

          const size =
            GamePacket.HEADER_SIZE_OUTGOING +
            8 +
            account.length +
            1 +
            4 +
            4 +
            20 +
            20 +
            4 +
            addonInfo.length;

          const app = new GamePacket(GameOpcode.CMSG_AUTH_PROOF, size);
          app.writeUInt32LE(build); // build
          app.writeUInt32LE(0); // (?)
          app.writeRawString(account); // account
          app.writeUInt32LE(0); // (?)

          app.writeBytes(seed); // client-seed

          app.writeUInt32LE(0); //wotlk
          app.writeUInt32LE(0); //wotlk
          app.writeUInt32LE(this.worldServer.realm?.id || 0); //realm id
          app.writeUInt32LE(0); //wotlk
          app.writeUInt32LE(0); //wotlk
          app.writeBytes(digest); // digest

          app.writeBytes(Buffer.from(addonInfo));

          this.worldServer.once(
            "packet:receive:SMSG_AUTH_RESPONSE",
            (gp: GamePacket) => {
              const result = gp.readUInt8();
              switch (result) {
                case 0x0d:
                  return reject("server-side auth/realm failure; try again");
                case 0x15:
                  return reject("account in use/invalid; aborting");
                default:
                  resolve();
              }
            }
          );

          this.worldServer.send(app);
          this.worldServer.beginArc4();
        }
      );
    });
  }
}
