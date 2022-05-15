import { ChatColor, Message } from "./message";
import { GamePacket } from "../game/packet";
import { MessageType } from "./utils/type";
import { GameOpcode } from "../game/opcode";
import { Language } from "./utils/language";

export class ChannelMessage extends Message {
  static type = MessageType.CHAT_MSG_CHANNEL;
  static color = ChatColor.General;

  constructor(text: string, public channelName: string) {
    super(text);
  }

  static async fromPacket(gp: GamePacket): Promise<Message> {
    const channelName = gp.readCString();
    const unknown = gp.readUnsignedInt();
    const len = gp.length - gp.index - 2; // channel buffer min size
    const text = gp.readString(len);
    return new ChannelMessage(text, channelName);
  }

  senderPrefix() {
    return `[${this.channelName}] ${super.senderPrefix()}`;
  }

  static async toPacket(
    channel: string,
    message: string,
    addon: boolean = false
  ): Promise<GamePacket> {
    const size = 64 + message.length;
    const app = new GamePacket(GameOpcode.CMSG_MESSAGE_CHAT, size);
    app.writeUnsignedInt(ChannelMessage.type);
    app.writeUnsignedInt(addon ? Language.LANG_ADDON : Language.LANG_UNIVERSAL);
    app.writeString(channel + "\0");
    app.writeRawString(message);
    return app;
  }
}
