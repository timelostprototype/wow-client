import { ChatColor, Message } from "./message";
import { GamePacket } from "../packet";
import { MessageType } from "./utils/type";
import { GameOpcode } from "../opcode";
import { Language } from "./utils/language";

export class YellMessage extends Message {
  static type = MessageType.CHAT_MSG_YELL;
  static color = ChatColor.Yell;

  constructor(text: string) {
    super(text);
  }

  static async fromPacket(gp: GamePacket): Promise<Message> {
    const msg = await Message.fromPacket(gp);
    return new YellMessage(msg.text);
  }

  static async toPacket(
    message: string,
    addon: boolean = false
  ): Promise<GamePacket> {
    const size = 64 + message.length;
    const app = new GamePacket(GameOpcode.CMSG_MESSAGE_CHAT, size);
    app.writeUInt32LE(YellMessage.type);
    app.writeUInt32LE(addon ? Language.LANG_ADDON : Language.LANG_UNIVERSAL);
    app.writeRawString(message);
    return app;
  }
}
