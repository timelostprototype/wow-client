import { ChatColor, Message } from "./message";
import { GamePacket } from "../game/packet";
import { MessageType } from "./utils/type";

export class EmoteMessage extends Message {
  static type = MessageType.CHAT_MSG_EMOTE;
  static color = ChatColor.Emote;

  constructor(text: string) {
    super(text);
  }

  static async fromPacket(gp: GamePacket): Promise<Message> {
    const msg = await Message.fromPacket(gp);
    return new EmoteMessage(msg.text);
  }
}
