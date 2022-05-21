import { EventEmitter } from "events";

import { AuthPacket } from "./auth/packet";
import { IndexedBuffer } from "../net/indexed-buffer";
import { Socket } from "../net/socket";
import { Config } from "../config";
import { AuthHandler } from "./auth/handler";
import { Realm } from "./realms/realm";
import { RealmsHandler } from "./realms/handler";

export interface RealmServerConfig {
  account: string;
  password: string;
  host: string;
  port?: number;
}

export class RealmServer extends EventEmitter {
  static DEFAULT_PORT = 3724;

  public socket: Socket = new Socket();
  private authHandler: AuthHandler;
  private realmsHandler: RealmsHandler;

  public key: Uint8Array = null;
  public realms: Realm[];

  constructor(public config: RealmServerConfig, public clientConfig: Config) {
    super();
    this.authHandler = new AuthHandler(this);
    this.realmsHandler = new RealmsHandler(this);
    this.socket.on("data:receive", this.dataReceived.bind(this));
  }

  async connect() {
    if (!this.socket.connected) {
      await this.socket.connect(
        this.config.host,
        this.config.port || RealmServer.DEFAULT_PORT
      );
    }
    this.key = await this.authHandler.authenticate();
    this.realms = await this.realmsHandler.list();
  }

  dataReceived(buffer: IndexedBuffer) {
    while (true) {
      if (this.socket.buffer.available < AuthPacket.HEADER_SIZE) {
        return;
      }
      const opcode = buffer.readUInt8();
      buffer.index -= AuthPacket.HEADER_SIZE;
      const data = Buffer.alloc(buffer.available);
      const bytes = buffer.readBytes(buffer.available);
      bytes.copy(data);
      const ap = new AuthPacket(opcode, data, false);

      console.debug("\t\u001b[33m⟹\u001b[0m", ap.toString());

      this.emit("packet:receive", ap);
      if (ap.opcodeName) {
        this.emit(`packet:receive:${ap.opcodeName}`, ap);
      }
    }
  }
}
