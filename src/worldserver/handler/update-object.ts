import { GameOpcode } from "../opcode";
import { GamePacket } from "../packet";
import { GameEventHandler } from "./handler";

export enum UpdateType {
  VALUES = 0,
  MOVEMENT = 1,
  CREATE_OBJECT = 1,
  CREATE_OBJECT_2 = 2,
  OUT_OF_RANGE_OBJECTS = 4,
  NEAR_OBJECTS = 5,
}

export class UpdateObjectHandler extends GameEventHandler {
  static opcode = GameOpcode.SMSG_UPDATE_OBJECT;
  async handle(gp: GamePacket) {
    const numObjects = gp.readUInt32LE();
    const objects = [];
    for (let i = 0; i < numObjects; i++) {
      const updateType = gp.readUInt8();
      switch (updateType) {
        case UpdateType.VALUES:
          this.parseValues(gp);
          break;
      }
    }
  }

  private parseValues(gp: GamePacket) {
    const guid = gp.readPackedGUID();

    const blocksCount = gp.readUInt8();
    const updateMask = [];
    for (let i = 0; i < blocksCount; i++) {
      updateMask.push(gp.readUInt32LE());
    }
    //TODO: bitarray handling
  }
}
