import { Client } from "../../client";
import { GamePacket } from "../../game/packet";
import { NameQuery } from "../../game/query/name";
import { ChannelMessage } from "../channel";
import { Message } from "../message";
import { SayMessage } from "../say";
import { SystemMessage } from "../system";
import { WhisperMessage } from "../whisper";
import { YellMessage } from "../yell";

const MESSAGE_TYPES = [
  SystemMessage,
  WhisperMessage,
  ChannelMessage,
  SayMessage,
  YellMessage,
];

export class MessageParser {
  constructor(public client: Client) {}

  async fromPacket(
    gp: GamePacket,
    isGm: boolean = false
  ): Promise<Message | undefined> {
    var type = gp.readUInt8(); // type
    const lang = gp.readUInt32LE(); // language
    const guid = gp.readGUID();
    const unk1 = gp.readUInt32LE();

    let senderName = "";
    if (isGm) {
      const nameLen = gp.readUInt32LE();
      senderName = gp.readBytes(nameLen).toString();
    } else {
      senderName = await new NameQuery(this.client.game).send(guid.toNumber());
    }

    let message: Message;
    for (let msgType of MESSAGE_TYPES) {
      if (type === msgType.type) {
        message = await msgType.fromPacket(gp);
      }
    }
    if (!message) {
      message = await Message.fromPacket(gp);
    }
    message.language = lang;
    message.sender = guid;
    message.senderName = senderName;
    message.isGm = isGm;
    return message;
  }
}
