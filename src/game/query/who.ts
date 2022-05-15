import { GameOpcode } from "../opcode";
import { GamePacket } from "../packet";
import { ClientRequest } from "./query";

export interface WhoResponseCharacter {
  name: string;
  guild: string;
  level: number;
  clazz: number;
  race: number;
  gender: number;
  zone: number;
}

export class WhoRequest extends ClientRequest {
  async send(name = "", min = 0, max = 100): Promise<WhoResponseCharacter[]> {
    const app = new GamePacket(GameOpcode.CMSG_WHO, 64);

    app.writeUnsignedInt(min);
    app.writeUnsignedInt(max);
    app.writeCString(name);
    app.writeCString("");
    app.writeUnsignedInt(255);
    app.writeUnsignedInt(255);
    app.writeUnsignedInt(0);
    app.writeUnsignedInt(0);

    return new Promise((resolve) => {
      this.game.once("packet:receive:SMSG_WHO", (gp) => {
        const results = [];
        const displayCount = gp.readUnsignedInt();
        const matchCount = gp.readUnsignedInt();
        for (let i = 0; i < displayCount; i++) {
          const name = gp.readRawString();
          const guild = gp.readRawString();
          const level = gp.readUnsignedInt();
          const clazz = gp.readUnsignedInt();
          const race = gp.readUnsignedInt();
          const gender = gp.readUnsignedByte();
          const zone = gp.readUnsignedInt();
          results.push({
            name,
            guild,
            level,
            clazz,
            race,
            gender,
            zone,
          });
        }
        resolve(results);
      });
      this.game.send(app);
    });
  }
}
