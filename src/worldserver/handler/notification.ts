import { Message } from "../chat/message";
import { GameOpcode } from "../opcode";
import { GamePacket } from "../packet";
import { GameEventHandler } from "./handler";

export class NotificationHandler extends GameEventHandler {
  static opcode = GameOpcode.SMSG_NOTIFICATION;
  handle(gp: GamePacket) {
    const str = gp.readRawString();
    console.log(Message.formatColorEscapes(str));
  }
}
