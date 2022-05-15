import { GameOpcode } from "../opcode";
import { GamePacket } from "../packet";
import { GameEventHandler } from "./handler";

export class FriendStatusHandler extends GameEventHandler {
  static opcode = GameOpcode.SMSG_FRIEND_STATUS;

  static readGuidFromPacket(gp: GamePacket) {
    const flag = gp.readUnsignedByte();
    const guid = gp.readUnsignedInt();
    let note = "";
    if (flag === 6 || flag === 7) {
      note = gp.readRawString();
    }
    let status = 0;
    if (flag === 6 || flag === 2) {
      status = gp.readUnsignedByte();
    }
    return guid;
  }

  handle(gp: GamePacket) {
    return FriendStatusHandler.readGuidFromPacket(gp);
  }
}
