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
  handleCharacterList(gp) {
    const count = gp.readByte(); // number of characters

    this.list.length = 0;

    for (let i = 0; i < count; ++i) {
      const character = new Character();

      character.guid = gp.readGUID();
      character.name = gp.readCString();
      character.race = gp.readUnsignedByte();
      character.class = gp.readUnsignedByte();
      character.gender = gp.readUnsignedByte();
      character.bytes = gp.readUnsignedInt();
      character.facial = gp.readUnsignedByte();
      character.level = gp.readUnsignedByte();
      character.zone = gp.readUnsignedInt();
      character.map = gp.readUnsignedInt();
      character.x = gp.readFloat();
      character.y = gp.readFloat();
      character.z = gp.readFloat();
      character.guild = gp.readUnsignedInt();
      character.flags = gp.readUnsignedInt();

      gp.readUnsignedInt(); // character customization
      gp.readUnsignedByte(); // (?)

      const pet = {
        model: gp.readUnsignedInt(),
        level: gp.readUnsignedInt(),
        family: gp.readUnsignedInt(),
      };
      if (pet.model) {
        character.pet = pet;
      }

      character.equipment = [];
      for (let j = 0; j < 23; ++j) {
        const item = {
          model: gp.readUnsignedInt(),
          type: gp.readUnsignedByte(),
          enchantment: gp.readUnsignedInt(),
        };
        character.equipment.push(item);
      }

      this.list.push(character);
    }

    this.emit("refresh");
  }
}
