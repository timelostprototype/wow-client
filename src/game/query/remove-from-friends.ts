import { FriendStatusHandler } from "../handler/friend-status";
import { GameOpcode } from "../opcode";
import { GamePacket } from "../packet";
import { ClientRequest } from "./query";

export class RemoveFromFriends extends ClientRequest {
  async send(guid: number): Promise<number | null> {
    const app = new GamePacket(
      GameOpcode.CMSG_DEL_FRIEND,
      GamePacket.OPCODE_SIZE_INCOMING + 64
    );
    app.writeUInt32LE(guid);

    return new Promise((resolve) => {
      this.game.once("packet:receive:SMSG_FRIEND_STATUS", (gp) => {
        resolve(FriendStatusHandler.readGuidFromPacket(gp));
      });
      this.game.send(app);
    });
  }
}
