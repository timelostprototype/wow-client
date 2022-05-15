import { Character } from "../../characters/character";
import { GUID } from "../guid";
import { GameOpcode } from "../opcode";
import { GamePacket } from "../packet";
import { ClientRequest } from "./query";

export class JoinWorldQuery extends ClientRequest {
  async join(character: Character): Promise<boolean | null> {
    if (character && character.guid) {
      console.info(`🧙 Joining game with character: ${character.toString()}`);

      const gp = new GamePacket(
        GameOpcode.CMSG_PLAYER_LOGIN,
        GamePacket.HEADER_SIZE_OUTGOING + GUID.LENGTH
      );
      gp.writeGUID(character.guid);

      return new Promise((resolve) => {
        this.game.once("packet:receive:SMSG_LOGIN_VERIFY_WORLD", (gp) => {
          console.log("🌎 Joined World");
          resolve(true);
        });
        this.game.send(gp);
      });
    }
    return false;
  }
}
