import { EventEmitter } from "events";
import { Config } from "../config";

import { Arc4 } from "../common/crypto/arc4";
import { PlayerNotFoundHandler } from "./handler/player-not-found";
import { NotificationHandler } from "./handler/notification";
import { MessageHandler } from "./handler/message";
import { TimeSyncHandler } from "./handler/time-sync";
import { GameOpcode } from "./opcode";
import { GamePacket } from "./packet";
import { IndexedBuffer } from "../common/net/indexed-buffer";
import { Socket } from "../common/net/socket";
import { Realm } from "../realmserver/realms/realm";
import { WorldAuthHandler } from "./auth/handler";
import { Character } from "./characters/character";
import { CharacterHandler } from "./characters/handler";
import { CompressedUpdateObjectHandler } from "./handler/compressed-update-object";
import { UpdateObjectHandler } from "./handler/update-object";

export interface WorldServerConfig {
  account: string;
}

export class WorldServer extends EventEmitter {
  private socket: Socket;
  private lastDecryptedHeader: Buffer = Buffer.alloc(0);
  private arc4?: Arc4;
  private remaining = -1;
  private pingCount = 1;
  private pingReceived = true;

  private authHandler: WorldAuthHandler;
  private charactersHandler: CharacterHandler;

  public characters: Character[] = [];
  public key?: Uint8Array;
  public realm?: Realm;

  constructor(public config: WorldServerConfig, public clientConfig: Config) {
    super();
    this.socket = new Socket(this.dataReceived.bind(this));
    this.authHandler = new WorldAuthHandler(this);
    this.charactersHandler = new CharacterHandler(this);

    const handlers = [
      new NotificationHandler(this),
      new TimeSyncHandler(this),
      new MessageHandler(this),
      new PlayerNotFoundHandler(this),
      new CompressedUpdateObjectHandler(this),
      new UpdateObjectHandler(this),
    ];
  }

  beginArc4() {
    this.arc4 = new Arc4(this.key!);
  }

  async connect(realm: Realm, key: Uint8Array) {
    this.realm = realm;
    this.key = key;
    this.socket.connect(this.realm.host, this.realm.port);
    await this.authHandler.authenticate();
    this.characters = await this.charactersHandler.list();
  }

  async join() {}

  // Data received handler
  dataReceived(indexedBuffer: IndexedBuffer) {
    while (true) {
      if (this.remaining === -1) {
        if (indexedBuffer.available < GamePacket.HEADER_SIZE_INCOMING) {
          return;
        }
        this.lastDecryptedHeader = Buffer.from(
          indexedBuffer.readBytes(GamePacket.HEADER_SIZE_INCOMING)
        );
        if (this.arc4) {
          this.lastDecryptedHeader = Buffer.from(
            this.arc4.decrypt(this.lastDecryptedHeader)
          );
        }
        this.remaining = this.lastDecryptedHeader.readUInt16BE();
      }

      const size = this.remaining;
      const dataSize = size - GamePacket.OPCODE_SIZE_INCOMING;
      if (this.remaining > 0 && indexedBuffer.available >= dataSize) {
        const opcode = this.lastDecryptedHeader.readUInt16LE(
          GamePacket.OPCODE_SIZE_INCOMING
        );
        const data = Buffer.alloc(size + GamePacket.HEADER_SIZE_INCOMING);
        this.lastDecryptedHeader.copy(data);
        indexedBuffer
          .readBytes(dataSize)
          .copy(data, GamePacket.HEADER_SIZE_INCOMING);

        const gp = new GamePacket(opcode, data, false);

        this.remaining = -1;

        const filterOpcodes = [
          GameOpcode.SMSG_MONSTER_MOVE,
          GameOpcode.SMSG_COMPRESSED_UPDATE_OBJECT,
          GameOpcode.SMSG_DESTROY_OBJECT,
          GameOpcode.SMSG_UPDATE_OBJECT,
          GameOpcode.SMSG_TIME_SYNC_REQ,
          GameOpcode.SMSG_PONG,
          GameOpcode.SMSG_FRIEND_STATUS,
        ];
        const skipFilter = true;

        if (filterOpcodes.indexOf(opcode) === -1 || skipFilter) {
          console.debug("\t\u001b[32m⟹\u001b[0m", gp.toString());
        }

        this.emit("packet:receive", gp);
        if (gp.opcodeName) {
          this.emit(`packet:receive:${gp.opcodeName}`, gp);
        }
      } else if (this.remaining !== 0) {
        return;
      }
    }
  }

  send(packet: GamePacket) {
    const size = packet.bodySize + GamePacket.OPCODE_SIZE_OUTGOING;

    packet.index = 0;
    packet.writeUInt16BE(size);
    packet.writeUInt32LE(packet.opcode);

    // Encrypt header if needed
    if (this.arc4) {
      const header = Buffer.alloc(GamePacket.HEADER_SIZE_OUTGOING);
      packet.buffer.copy(header);
      const encryptedHeader = this.arc4.encrypt(new Uint8Array(header));
      Buffer.from(encryptedHeader).copy(packet.buffer);
    }

    return this.socket.send(packet);
  }

  handlePong(gp: GamePacket) {
    this.pingReceived = true;
    var ping = gp.readUInt32LE(); // (0x01)
  }

  ping() {
    if (this.pingReceived === false) {
      this.socket.disconnect();
    }

    const app = new GamePacket(
      GameOpcode.CMSG_PING,
      GamePacket.OPCODE_SIZE_INCOMING + 64
    );
    app.writeUInt32LE(this.pingCount);
    app.writeUInt32LE(Math.floor(Math.random() * 20) + 20); //latency, simulate jitter

    this.pingReceived = false;
    this.send(app);
    this.pingCount++;
  }
}
