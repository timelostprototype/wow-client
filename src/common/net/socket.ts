import { EventEmitter } from "events";
import { Socket as NetSock } from "net";
import { Packet } from "./packet";
import { Buffer } from "buffer";
import { IndexedBuffer } from "./indexed-buffer";
import { GameOpcode } from "../../worldserver/opcode";

export class Socket {
  public host?: string;
  public port?: number;

  public socket?: NetSock;

  private buffer: IndexedBuffer = new IndexedBuffer();

  constructor(private onData: (buf: IndexedBuffer) => void) {}

  get connected() {
    return this.socket;
  }

  async connect(host: string, port = NaN) {
    this.host = host;
    this.port = port;
    if (!this.connected) {
      return new Promise((resolve, reject) => {
        const sock = new NetSock();

        sock.on("data", (data: Buffer) => {
          this.buffer.appendBytes(data);
          this.buffer.clip();
          this.onData(this.buffer);
        });

        sock.on("close", (e) => {
          console.info("Socket close: " + this.port);
          console.info(e);
        });

        sock.on("error", (err) => {
          console.error(new Error().stack);
        });

        sock.on("connect", () => {
          this.socket = sock;
          resolve(this);
        });

        sock.connect(this.port, this.host);
      });
    } else {
      return this;
    }
  }

  // Attempts to reconnect to cached host and port
  reconnect() {
    if (!this.connected && this.host && this.port) {
      this.connect(this.host, this.port);
    }
    return this;
  }

  // Disconnects this socket
  disconnect() {
    if (this.connected) {
      this.socket.end();
    }
    return this;
  }

  // Finalizes and sends given packet
  send(packet: Packet) {
    if (this.connected) {
      packet.finalize();

      const filterOpcodes = [
        GameOpcode.CMSG_PING,
        GameOpcode.CMSG_TIME_SYNC_RESP,
        GameOpcode.CMSG_ADD_FRIEND,
        GameOpcode.CMSG_DEL_FRIEND,
      ];
      const skipFilter = false;

      if (filterOpcodes.indexOf(packet.opcode) === -1 || skipFilter) {
        console.debug("\t\u001b[36m⟸\u001b[0m", packet.toString());
      }

      this.socket.write(packet.buffer);

      return true;
    }

    return false;
  }
}
