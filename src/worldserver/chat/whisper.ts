import { ChatColor, Message } from "./message";
import { GamePacket } from "../packet";
import { MessageType } from "./utils/type";
import { GameOpcode } from "../opcode";
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
    const len = gp.readUInt32LE();
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
    app.writeUInt32LE(MessageType.CHAT_MSG_WHISPER);
    app.writeUInt32LE(addon ? Language.LANG_ADDON : Language.LANG_UNIVERSAL);
    app.writeRawString(recipientName);
    app.writeRawString(message);
    return app;
  }
}
