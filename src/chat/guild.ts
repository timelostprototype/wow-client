import { ChatColor, Message } from "./message";
import { GamePacket } from "../game/packet";
import { MessageType } from "./utils/type";
import { GameOpcode } from "../game/opcode";
import { Language } from "./utils/language";

export class GuildMessage extends Message {
  static type = MessageType.CHAT_MSG_GUILD;
  static color = ChatColor.Guild;

  constructor(text: string) {
    super(text);
  }

  static async fromPacket(gp: GamePacket): Promise<Message> {
    const msg = await Message.fromPacket(gp);
    return new GuildMessage(msg.text);
  }

  static async toPacket(
    message: string,
    addon: boolean = false
  ): Promise<GamePacket> {
    const size = 64 + message.length;
    const app = new GamePacket(GameOpcode.CMSG_MESSAGE_CHAT, size);
    app.writeUInt32LE(GuildMessage.type);
    app.writeUInt32LE(addon ? Language.LANG_ADDON : Language.LANG_UNIVERSAL);
    app.writeRawString(message);
    return app;
  }
}
