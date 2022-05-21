import { EventEmitter } from "events";

import { Character } from "./character";
import { GamePacket } from "../game/packet";
import { GameOpcode } from "../game/opcode";
import { Client } from "../client";

export class CharacterHandler extends EventEmitter {
  public list: Character[] = [];
  // Creates a new character handler
  constructor(private session: Client) {
    super();

    // Listen for character list
    this.session.game.on("packet:receive:SMSG_CHAR_ENUM", (gp) =>
      this.handleCharacterList(gp)
    );
  }

  // Requests a fresh list of characters
  async refresh() {
    console.info("refreshing character list");

    const gp = new GamePacket(GameOpcode.CMSG_CHAR_ENUM);

    this.session.game.send(gp);

    return new Promise((resolve) => this.on("refresh", resolve));
  }

  // Character list refresh handler (SMSG_CHAR_ENUM)
  handleCharacterList(gp: GamePacket) {
    const count = gp.readUInt8(); // number of characters

    this.list.length = 0;

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

      this.list.push(character);
    }

    this.emit("refresh");
  }
}
