import { ChatColor, Message } from "./message";
import { GamePacket } from "../game/packet";
import { MessageType } from "./utils/type";

export class SystemMessage extends Message {
  static type = MessageType.CHAT_MSG_SYSTEM;
  static color = ChatColor.System;

  constructor(text: string) {
    super(text);
  }

  static async fromPacket(gp: GamePacket): Promise<Message> {
    gp.readUnsignedInt();
    gp.readUnsignedInt();
    const len = gp.readUnsignedInt();
    const text = gp.readString(len);
    return new SystemMessage(text);
  }
}
