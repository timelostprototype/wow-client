import { ChatColor, Message } from "./message";
import { GamePacket } from "../packet";
import { MessageType } from "./utils/type";

export class SystemMessage extends Message {
  static type = MessageType.CHAT_MSG_SYSTEM;
  static color = ChatColor.System;

  constructor(text: string) {
    super(text);
  }

  static async fromPacket(gp: GamePacket): Promise<Message> {
    gp.readUInt32LE();
    gp.readUInt32LE();
    const len = gp.readUInt32LE();
    const text = gp.readBytes(len).toString();
    return new SystemMessage(text);
  }
}
