import { GamePacket } from "../game/packet";
import { MessageType } from "./utils/type";
import { GUID } from "../game/guid";

export enum ChatColor {
  General = "FEC1C0",
  System = "FFFF00",
  Guild = "3CE13F",
  Officer = "40BC40",
  Party = "AAABFE",
  PartyLeader = "77C8FF",
  LinkedSpells = "67BCFF",
  Say = "FFFFFF",
  Whisper = "FF7EFF",
  Yell = "FF3F40",
  Emote = "FF7E40",
  Raid = "FF7D01",
  RaidLeader = "FF4709",
  RaidWarning = "FF4700",
  Achievement = "FFFC01",
}

export class Message {
  protected static type = MessageType.CHAT_MSG_SYSTEM;
  protected static color = ChatColor.System;

  public isGm: boolean = false;
  public language: number;
  public sender: GUID;
  public senderName: string;

  constructor(public text: string) {}

  get type() {
    return this.ctor.type;
  }

  get color() {
    return this.ctor.color;
  }

  get ctor() {
    return <typeof Message>this.constructor;
  }

  static hexToRgb(color: string): string {
    color = color.toString();
    var r = parseInt(color.substring(0, 2), 16);
    var g = parseInt(color.substring(2, 4), 16);
    var b = parseInt(color.substring(4, 6), 16);

    return `\u001b[38;2;${r};${g};${b}m`;
  }

  static formatColorEscapes(str: string): string {
    const pat = new RegExp("\\|cff(.{6})", "gi");
    let match;
    while ((match = pat.exec(str)) !== null) {
      str = str.replace(match[0], this.hexToRgb(match[1]));
    }
    str = str.replace(/\|r/gi, "\u001b[0m");
    return str;
  }

  public senderPrefix() {
    return this.senderName ? `[${this.senderName}]: ` : "";
  }

  public get logLine() {
    return `${Message.hexToRgb(
      this.color
    )}${this.senderPrefix()}${Message.formatColorEscapes(this.text)}\u001b[0m`;
  }

  static async fromPacket(
    gp: GamePacket,
    isGm: boolean = false
  ): Promise<Message | undefined> {
    const guid2 = gp.readGUID();
    const len = gp.readUnsignedInt();
    const text = gp.readString(len);
    const flags = gp.readUnsignedByte();
    return new Message(text);
  }
}
