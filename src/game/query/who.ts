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

    app.writeUInt32LE(min);
    app.writeUInt32LE(max);
    app.writeRawString(name);
    app.writeRawString("");
    app.writeUInt32LE(255);
    app.writeUInt32LE(255);
    app.writeUInt32LE(0);
    app.writeUInt32LE(0);

    return new Promise((resolve) => {
      this.game.once("packet:receive:SMSG_WHO", (gp: GamePacket) => {
        const results = [];
        const displayCount = gp.readUInt32LE();
        const matchCount = gp.readUInt32LE();
        for (let i = 0; i < displayCount; i++) {
          const name = gp.readRawString();
          const guild = gp.readRawString();
          const level = gp.readUInt32LE();
          const clazz = gp.readUInt32LE();
          const race = gp.readUInt32LE();
          const gender = gp.readUInt8();
          const zone = gp.readUInt32LE();
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
