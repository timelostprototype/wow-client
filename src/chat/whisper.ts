import { ChatColor, Message } from "./message";
import { GamePacket } from "../game/packet";
import { MessageType } from "./utils/type";
import { GameOpcode } from "../game/opcode";
import { Language } from "./utils/language";

export class WhisperMessage extends Message {
  static type = MessageType.CHAT_MSG_WHISPER;
  static color = ChatColor.Whisper;

  constructor(text: string) {
    super(text);
  }

  replyPacket(message: string) {
    return WhisperMessage.toPacket(this.senderName, message);
  }

  static async fromPacket(gp: GamePacket): Promise<Message> {
    const b = gp.readGUID();
    const len = gp.readUnsignedInt();
    const text = gp.readRawString();
    return new WhisperMessage(text);
  }

  static async toPacket(
    recipientName: string,
    message: string,
    addon: boolean = false
  ): Promise<GamePacket> {
    const size = 64 + message.length;
    const app = new GamePacket(GameOpcode.CMSG_MESSAGE_CHAT, size);
    app.writeUnsignedInt(MessageType.CHAT_MSG_WHISPER);
    app.writeUnsignedInt(addon ? Language.LANG_ADDON : Language.LANG_UNIVERSAL);
    app.writeString(recipientName + "\0");
    app.writeRawString(message);
    return app;
  }
}
