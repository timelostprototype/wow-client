import { Buffer } from "buffer";

import { randomBytes, createHash } from "crypto";
import { Crypt } from "../crypto/crypt";
import { GameOpcode } from "./opcode";
import { GamePacket } from "./packet";
import { Socket } from "../net/socket";
import { Client } from "../client.js";
import { NotificationHandler } from "./handler/notification";
import { TimeSyncHandler } from "./handler/time-sync";
import { MessageHandler } from "./handler/message";
import { IndexedBuffer } from "../net/indexed-buffer";
import { PlayerNotFoundHandler } from "./handler/player-not-found";

export class GameHandler extends Socket {
  public realmId: number = 0;

  private pingCount = 1;
  private pingReceived = true;
  private remaining = -1;

  private _crypt: Crypt = null;

  // Creates a new game handler
  constructor(public session: Client) {
    super();
    // Holds session
    this.session = session;

    const handlers = {
      "data:receive": this.dataReceived,
      "packet:receive:SMSG_PONG": this.handlePong,
      "packet:receive:SMSG_AUTH_CHALLENGE": this.handleAuthChallenge,
      "packet:receive:SMSG_AUTH_RESPONSE": this.handleAuthResponse,
    };
    for (const [name, fn] of Object.entries(handlers)) {
      this.on(name, fn.bind(this));
    }

    const otherHandlers = [
      new NotificationHandler(this),
      new TimeSyncHandler(this),
      new MessageHandler(this),
      new PlayerNotFoundHandler(this),
    ];
  }

  // Connects to given host through given port
  connect(host: string, port: number) {
    if (!this.connected) {
      super.connect(host, port);
      console.info("connecting to game-server @", this.host, ":", this.port);
    }
    return new Promise((resolve, reject) => {
      this.on("authenticate", resolve);
      this.on("reject", reject);
    });
  }

  // Finalizes and sends given packet
  send(packet: GamePacket) {
    const size = packet.bodySize + GamePacket.OPCODE_SIZE_OUTGOING;

    packet.index = 0;
    packet.writeUInt16BE(size);
    packet.writeUInt32LE(packet.opcode);

    // Encrypt header if needed
    if (this._crypt) {
      const encryptedHeader = this._crypt.encrypt(
        new Uint8Array(packet.buffer, 0, GamePacket.HEADER_SIZE_OUTGOING)
      );
      Buffer.from(encryptedHeader).copy(
        packet.buffer,
        0,
        0,
        GamePacket.HEADER_SIZE_OUTGOING
      );
      //packet.buffer.set(encryptedHeader, 0);
    }

    return super.send(packet);
  }

  private lastDecryptedHeader: Buffer = null;
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
        if (this._crypt) {
          this.lastDecryptedHeader = Buffer.from(
            this._crypt.decrypt(this.lastDecryptedHeader)
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

  // Pong handler (SMSG_PONG)
  handlePong(gp: GamePacket) {
    //console.log(`🏓  #${this.pingCount}`);
    this.pingReceived = true;
    var ping = gp.readUInt32LE(); // (0x01)
  }

  ping() {
    if (this.pingReceived === false) {
      this.disconnect();
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

  // Auth challenge handler (SMSG_AUTH_CHALLENGE)
  handleAuthChallenge(gp: GamePacket) {
    console.info("handling auth challenge");

    gp.readUInt32LE(); // (0x01)

    const salt = gp.readBytes(4);
    const seed = randomBytes(4);

    const hash = createHash("sha1");
    hash.update(this.session.auth.account);
    hash.update(new Uint8Array(4));
    hash.update(seed);
    hash.update(salt);
    hash.update(this.session.auth.key);
    const digest = hash.digest();

    const build = this.session.config.build;
    const account = this.session.auth.account;

    const addonInfo = [
      0x56, 0x01, 0x00, 0x00, 0x78, 0x9c, 0x75, 0xcc, 0xbd, 0x0e, 0xc2, 0x30,
      0x0c, 0x04, 0xe0, 0xf2, 0x1e, 0xbc, 0x0c, 0x61, 0x40, 0x95, 0xc8, 0x42,
      0xc3, 0x8c, 0x4c, 0xe2, 0x22, 0x0b, 0xc7, 0xa9, 0x8c, 0xcb, 0x4f, 0x9f,
      0x1e, 0x16, 0x24, 0x06, 0x73, 0xeb, 0x77, 0x77, 0x81, 0x69, 0x59, 0x40,
      0xcb, 0x69, 0x33, 0x67, 0xa3, 0x26, 0xc7, 0xbe, 0x5b, 0xd5, 0xc7, 0x7a,
      0xdf, 0x7d, 0x12, 0xbe, 0x16, 0xc0, 0x8c, 0x71, 0x24, 0xe4, 0x12, 0x49,
      0xa8, 0xc2, 0xe4, 0x95, 0x48, 0x0a, 0xc9, 0xc5, 0x3d, 0xd8, 0xb6, 0x7a,
      0x06, 0x4b, 0xf8, 0x34, 0x0f, 0x15, 0x46, 0x73, 0x67, 0xbb, 0x38, 0xcc,
      0x7a, 0xc7, 0x97, 0x8b, 0xbd, 0xdc, 0x26, 0xcc, 0xfe, 0x30, 0x42, 0xd6,
      0xe6, 0xca, 0x01, 0xa8, 0xb8, 0x90, 0x80, 0x51, 0xfc, 0xb7, 0xa4, 0x50,
      0x70, 0xb8, 0x12, 0xf3, 0x3f, 0x26, 0x41, 0xfd, 0xb5, 0x37, 0x90, 0x19,
      0x66, 0x8f,
    ];

    const size =
      GamePacket.HEADER_SIZE_OUTGOING +
      8 +
      this.session.auth.account.length +
      1 +
      4 +
      4 +
      20 +
      20 +
      4 +
      addonInfo.length;

    const app = new GamePacket(GameOpcode.CMSG_AUTH_PROOF, size);
    app.writeUInt32LE(build); // build
    app.writeUInt32LE(0); // (?)
    app.writeRawString(account); // account
    app.writeUInt32LE(0); // (?)

    app.writeBytes(seed); // client-seed

    app.writeUInt32LE(0); //wotlk
    app.writeUInt32LE(0); //wotlk
    app.writeUInt32LE(this.realmId); //realm id
    app.writeUInt32LE(0); //wotlk
    app.writeUInt32LE(0); //wotlk
    app.writeBytes(digest); // digest

    app.writeBytes(Buffer.from(addonInfo));

    this.send(app);

    this._crypt = new Crypt(this.session.auth.key);
  }

  // Auth response handler (SMSG_AUTH_RESPONSE)
  handleAuthResponse(gp: GamePacket) {
    console.info("handling auth response");

    // Handle result byte
    const result = gp.readUInt8();
    if (result === 0x0d) {
      console.warn("server-side auth/realm failure; try again");
      this.emit("reject");
      return;
    }

    if (result === 0x15) {
      console.warn("account in use/invalid; aborting");
      this.emit("reject");
      return;
    }

    setInterval(() => {
      this.ping();
    }, 30000);

    // TODO: Ensure the account is flagged as WotLK (expansion //2)

    this.emit("authenticate");
  }
}
