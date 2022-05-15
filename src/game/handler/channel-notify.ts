import { GameOpcode } from "../opcode";
import { GamePacket } from "../packet";
import { GameEventHandler } from "./handler";

export class ChannelNotifyHandler extends GameEventHandler {
  static opcode = GameOpcode.SMSG_CHANNEL_NOTIFY;
  async handle(gp: GamePacket) {
    console.log(gp);
  }
}
