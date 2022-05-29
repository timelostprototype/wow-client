import { inflate } from "zlib";
import { promisify } from "util";
import { GameOpcode } from "../opcode";
import { GamePacket } from "../packet";
import { GameEventHandler } from "./handler";

export class CompressedUpdateObjectHandler extends GameEventHandler {
  static opcode = GameOpcode.SMSG_COMPRESSED_UPDATE_OBJECT;
  async handle(gp: GamePacket) {
    const compressedLength = gp.readUInt32LE();
    const compressedData = gp.readBytes(gp.available);
    const deflated = await promisify(inflate)(compressedData);

    const data = Buffer.alloc(
      compressedLength + GamePacket.HEADER_SIZE_INCOMING
    );
    data.writeUint16BE(compressedLength);
    data.writeUint16LE(GameOpcode.SMSG_UPDATE_OBJECT, 2);
    deflated.copy(data, GamePacket.HEADER_SIZE_INCOMING);

    const updatePacket = new GamePacket(
      GameOpcode.SMSG_UPDATE_OBJECT,
      data,
      false
    );

    this.world.emit(`packet:receive:${updatePacket.opcodeName}`, updatePacket);
  }
}
