import { GameOpcode } from "../opcode";
import { GamePacket } from "../packet";
import { GameEventHandler } from "./handler";

export class TimeSyncHandler extends GameEventHandler {
  private connectionTime = Date.now();

  static opcode = GameOpcode.SMSG_TIME_SYNC_REQ;
  handle(gp: GamePacket) {
    const counter = gp.readUnsignedInt();
    const ellapsed = Date.now() - this.connectionTime;
    const app = new GamePacket(
      GameOpcode.CMSG_TIME_SYNC_RESP,
      GamePacket.OPCODE_SIZE_INCOMING + 64
    );
    app.writeUnsignedInt(counter); // counter
    app.writeUnsignedInt(ellapsed); //uptime

    this.game.send(app);
  }
}
