import { FriendStatusHandler } from "../handler/friend-status";
import { GameOpcode } from "../opcode";
import { GamePacket } from "../packet";
import { ClientRequest } from "./query";

export class AddToFriends extends ClientRequest {
  async send(name: string): Promise<number | null> {
    const app = new GamePacket(
      GameOpcode.CMSG_ADD_FRIEND,
      GamePacket.OPCODE_SIZE_INCOMING + 256
    );
    app.writeRawString(name);
    app.writeRawString("");

    return new Promise((resolve) => {
      this.world.once("packet:receive:SMSG_FRIEND_STATUS", (gp) => {
        resolve(FriendStatusHandler.readGuidFromPacket(gp));
      });
      this.world.send(app);
    });
  }
}
