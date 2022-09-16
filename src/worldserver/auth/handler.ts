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
        async (gp: GamePacket) => {
          gp.readUInt32LE(); // (0x01)

          const account = this.worldServer.config.account;

          const salt = gp.readBytes(4);
          const seed = randomBytes(4);

          const hash = createHash("sha1");

          hash.update(account.toUpperCase());
          hash.update(new Uint8Array(4));
          hash.update(seed);
          hash.update(salt);
          hash.update(this.worldServer.key!);
          const digest = hash.digest();

          const build = this.worldServer.clientConfig.build;

          const compressedAddonInfo =
            await this.worldServer.clientConfig.addonInfo.compress();

          const size =
            GamePacket.HEADER_SIZE_OUTGOING +
            8 +
            account.length +
            1 +
            4 +
            4 +
            20 +
            20 +
            compressedAddonInfo.length;

          const app = new GamePacket(GameOpcode.CMSG_AUTH_PROOF, size);
          app.writeUInt32LE(build); // build
          app.writeUInt32LE(0); // login server id (always 0?)
          app.writeRawString(account.toUpperCase()); // account
          app.writeUInt32LE(0); // login server type

          app.writeBytes(seed); // client-seed

          app.writeUInt32LE(0); //region id
          app.writeUInt32LE(0); //battlegroup id
          app.writeUInt32LE(this.worldServer.realm?.id || 0); //realm id
          app.writeUInt32LE(2);
          app.writeUInt32LE(0); //DosResponse (64 bits)
          app.writeBytes(digest); // digest

          app.writeBytes(Buffer.from(compressedAddonInfo));

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
