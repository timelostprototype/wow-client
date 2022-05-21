import { Character } from "./character";
import { WorldServer } from "../worldserver";
import { GamePacket } from "../packet";
import { GameOpcode } from "../opcode";

export class CharacterHandler {
  constructor(private worldServer: WorldServer) {}

  async list(): Promise<Character[]> {
    return new Promise((resolve, reject) => {
      this.worldServer.once("packet:receive:SMSG_CHAR_ENUM", (gp) => {
        const list = [];
        const count = gp.readUInt8(); // number of characters

        for (let i = 0; i < count; ++i) {
          const character = new Character();

          character.guid = gp.readGUID();
          character.name = gp.readRawString();
          character.race = gp.readUInt8();
          character.class = gp.readUInt8();
          character.gender = gp.readUInt8();
          character.bytes = gp.readUInt32LE();
          character.facial = gp.readUInt8();
          character.level = gp.readUInt8();
          character.zone = gp.readUInt32LE();
          character.map = gp.readUInt32LE();
          character.x = gp.readFloatLE();
          character.y = gp.readFloatLE();
          character.z = gp.readFloatLE();
          character.guild = gp.readUInt32LE();
          character.flags = gp.readUInt32LE();

          gp.readUInt32LE(); // character customization
          gp.readUInt8(); // (?)

          const pet = {
            model: gp.readUInt32LE(),
            level: gp.readUInt32LE(),
            family: gp.readUInt32LE(),
          };
          if (pet.model) {
            character.pet = pet;
          }

          character.equipment = [];
          for (let j = 0; j < 23; ++j) {
            const item = {
              model: gp.readUInt32LE(),
              type: gp.readUInt8(),
              enchantment: gp.readUInt32LE(),
            };
            character.equipment.push(item);
          }

          list.push(character);
        }
        resolve(list);
      });
      const gp = new GamePacket(GameOpcode.CMSG_CHAR_ENUM);
      this.worldServer.send(gp);
    });
  }
}
