import { MessageParser } from "../../chat/utils/parser";
import { GameOpcode } from "../opcode";
import { GamePacket } from "../packet";
import { GameEventHandler } from "./handler";

export class GmMessageHandler extends GameEventHandler {
  static opcode = GameOpcode.SMSG_GM_MESSAGECHAT;
  async handle(gp: GamePacket) {
    const parser = new MessageParser(this.game.session);
    const message = await parser.fromPacket(gp, true);
    this.game.emit("message", message);
  }
}
