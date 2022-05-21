import { GameOpcode } from "../opcode";
import { GamePacket } from "../packet";
import { GameEventHandler } from "./handler";

export class PlayerNotFoundHandler extends GameEventHandler {
  static opcode = GameOpcode.SMSG_CHAT_PLAYER_NOT_FOUND;
  async handle(gp: GamePacket) {
    const name = gp.readRawString();
    this.world.emit("playerNotFound", name);
  }
}
