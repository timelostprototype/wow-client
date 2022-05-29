import { WorldServer } from "../../worldserver/worldserver";
import { GameOpcode } from "../opcode";
import { GamePacket } from "../packet";

export abstract class GameEventHandler {
  protected static opcode: GameOpcode;

  constructor(protected world: WorldServer) {
    const opcode: GameOpcode = (<typeof GameEventHandler>this.constructor)
      .opcode;
    const opcodeName = GameOpcode.toString(opcode);
    world.on(`packet:receive:${opcodeName}`, this.handle.bind(this));
  }

  abstract handle(gp: GamePacket): void;
}
