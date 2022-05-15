import { GameHandler } from "../handler";
import { GameOpcode } from "../opcode";
import { GamePacket } from "../packet";

export abstract class GameEventHandler {
  protected static opcode: GameOpcode;

  constructor(protected game: GameHandler) {
    const opcode: GameOpcode = (<typeof GameEventHandler>this.constructor)
      .opcode;
    game.on(`packet:receive:${opcode.toString()}`, this.handle.bind(this));
  }

  abstract handle(gp: GamePacket): void;
}
