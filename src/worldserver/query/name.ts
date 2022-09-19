import { GameOpcode } from "../opcode";
import { GamePacket } from "../packet";
import { ClientRequest } from "./query";

export class NameQuery extends ClientRequest {
  async send(guid: number): Promise<string> {
    if (guid === 0) {
      return `SYSTEM`;
    }
    const app = new GamePacket(GameOpcode.CMSG_NAME_QUERY, 64);
    app.writeUInt32LE(guid);

    return new Promise((resolve) => {
      this.world.once("packet:receive:SMSG_NAME_QUERY_RESPONSE", (gp) => {
        const guid = gp.readPackedGUID();
        const name_known = gp.readUInt8();
        if (!name_known) {
          return resolve("");
        }
        const name = gp.readRawString();
        resolve(name);
      });
      this.world.send(app);
    });
  }
}
