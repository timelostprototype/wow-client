import { Buffer } from "buffer";

import { ChallengeOpcode } from "./challenge-opcode";
import { AuthOpcode } from "./opcode";
import { AuthPacket } from "./packet";
import { Socket } from "../net/socket";
import { Client } from "../client";

import {
  arrayBufferToBigInt,
  bigIntToArrayBuffer,
  SRPParameters,
  SRPRoutines,
  SRPClientSession,
} from "tssrp6a";
import { IndexedBuffer } from "../net/indexed-buffer";
import { Packet } from "../net/packet";

export class AuthHandler extends Socket {
  // Default port for the auth-server
  static PORT = 3724;

  public account: string = "";
  public password: string = "";

  public key: Uint8Array = null;

  // Creates a new authentication handler
  constructor(private session: Client) {
    super();

    // Listen for incoming data
    this.on("data:receive", this.dataReceived);

    // Delegate packets
    this.on("packet:receive:LOGON_CHALLENGE", this.handleLogonChallenge);
    //this.on("packet:receive:LOGON_PROOF", this.handleLogonProof);
  }

  // Connects to given host through given port
  async connect(host: string, port: number = AuthHandler.PORT) {
    if (!this.connected) {
      console.info("connecting to auth-server @", host, ":", port);
      return super.connect(host, port);
    }
    return this;
  }

  // Sends authentication request to connected host
  async authenticate(account: string, password: string) {
    if (!this.connected) {
      return false;
    }

    this.account = account.toUpperCase();
    this.password = password.toUpperCase();

    console.info("authenticating", this.account);

    // Extract configuration data
    const {
      build,
      majorVersion,
      minorVersion,
      patchVersion,
      game,
      raw: { os, locale, platform },
      timezone,
    } = this.session.config;

    const ap = new AuthPacket(
      AuthOpcode.LOGON_CHALLENGE,
      4 + 29 + 1 + this.account.length
    );
    ap.writeUInt8(0x00);
    ap.writeUInt16LE(30 + this.account.length);

    const rawGameBytes = game.split("").map((x) => x.charCodeAt(0));
    ap.writeBytes(Buffer.from(game)); // game string
    ap.writeUInt8(majorVersion); // v1 (major)
    ap.writeUInt8(minorVersion); // v2 (minor)
    ap.writeUInt8(patchVersion); // v3 (patch)
    ap.writeUInt16LE(build); // build
    ap.writeBytes(Buffer.from(platform)); // platform
    ap.writeBytes(Buffer.from(os)); // os
    ap.writeBytes(Buffer.from(locale)); // locale
    ap.writeUInt32LE(timezone); // timezone
    ap.writeUInt32LE(0); // ip
    ap.writeUInt8(this.account.length); // account length
    ap.writeBytes(Buffer.from(this.account)); // account

    this.send(ap);

    return new Promise((resolve, reject) => {
      this.once("authenticate", resolve);
      this.once("reject", reject);
    });
  }

  // Data received handler
  dataReceived(buffer: IndexedBuffer) {
    while (true) {
      if (this.buffer.available < AuthPacket.HEADER_SIZE) {
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

  // Logon challenge handler (LOGON_CHALLENGE)
  async handleLogonChallenge(ap: AuthPacket) {
    ap.readUInt8();
    const status = ap.readUInt8();

    switch (status) {
      case ChallengeOpcode.SUCCESS:
        console.info("received logon challenge");

        const B = ap.readBigInt(32, false); // B

        const glen = ap.readUInt8(); // g-length
        const g = ap.readBigInt(glen); // g

        const Nlen = ap.readUInt8(); // n-length
        const N = ap.readBigInt(Nlen); // N

        const salt = ap.readBigInt(32, false); // salt

        ap.readBytes(16); // unknown
        ap.readUInt8(); // security flags

        const srp6aNimbusRoutines = new SRPRoutines(
          new SRPParameters({ g, N }, SRPParameters.H.SHA1)
        );
        const srp6aNimbusClient = new SRPClientSession(srp6aNimbusRoutines);
        const client1 = await srp6aNimbusClient.step1(
          this.account,
          this.account + ":" + this.password
        );
        const arrayBufferReverseToInt = (arrayBuffer: ArrayBuffer) => {
          const hex = [];
          new Uint8Array(arrayBuffer).reverse().forEach((i) => {
            hex.push(("0" + i.toString(16)).slice(-2));
          });
          return BigInt(`0x${hex.join("")}`);
        };
        const hash1 = await srp6aNimbusRoutines.hash(
          bigIntToArrayBuffer(salt),
          client1.IH
        );
        const x = arrayBufferReverseToInt(hash1);
        const a = srp6aNimbusRoutines.generatePrivateValue();
        const A = srp6aNimbusRoutines.computeClientPublicValue(a);

        const A_REV_INT = arrayBufferReverseToInt(bigIntToArrayBuffer(A));
        const B_REV_INT = arrayBufferReverseToInt(bigIntToArrayBuffer(B));

        const A_REV = bigIntToArrayBuffer(A_REV_INT);
        const hash2 = await srp6aNimbusRoutines.hashPadded(
          A_REV,
          bigIntToArrayBuffer(B)
        );
        const u = arrayBufferReverseToInt(hash2);

        const reverseArrayBuffer = (buf) =>
          bigIntToArrayBuffer(
            arrayBufferReverseToInt(bigIntToArrayBuffer(buf))
          );
        const S_INT = srp6aNimbusRoutines.computeClientSessionKey(
          BigInt(3),
          x,
          u,
          a,
          B_REV_INT
        );
        const S = new Uint8Array(
          bigIntToArrayBuffer(
            arrayBufferReverseToInt(bigIntToArrayBuffer(S_INT))
          )
        );
        const S1 = [];
        const S2 = [];
        for (let i = 0; i < 16; ++i) {
          S1[i] = S[i * 2];
          S2[i] = S[i * 2 + 1];
        }

        // Hash these byte-arrays
        const S1h_RAW = await srp6aNimbusRoutines.hash(
          new Uint8Array(S1).buffer
        );
        const S2h_RAW = await srp6aNimbusRoutines.hash(
          new Uint8Array(S2).buffer
        );
        const S1h = new Uint8Array(S1h_RAW);
        const S2h = new Uint8Array(S2h_RAW);

        const K = [];
        for (let i = 0; i < 20; ++i) {
          K[i * 2] = S1h[i];
          K[i * 2 + 1] = S2h[i];
        }

        const usernameHash = await srp6aNimbusRoutines.hash(
          new TextEncoder().encode(this.account).buffer
        );
        const nHash = await srp6aNimbusRoutines.hash(
          bigIntToArrayBuffer(arrayBufferReverseToInt(bigIntToArrayBuffer(N)))
        );
        const gHash = await srp6aNimbusRoutines.hash(
          bigIntToArrayBuffer(arrayBufferReverseToInt(bigIntToArrayBuffer(g)))
        );
        const nHashArr = new Uint8Array(nHash);
        const gHashArr = new Uint8Array(gHash);

        const Ngh = [];
        for (let i = 0; i < 20; ++i) {
          Ngh[i] = nHashArr[i] ^ gHashArr[i];
        }
        const K_BUF = new Uint8Array(K).buffer;
        this.key = new Uint8Array(K);

        const M1 = await srp6aNimbusRoutines.hash(
          new Uint8Array(Ngh).buffer,
          usernameHash,
          bigIntToArrayBuffer(salt),
          reverseArrayBuffer(A),
          bigIntToArrayBuffer(B),
          K_BUF
        );

        const M2 = await srp6aNimbusRoutines.hash(
          reverseArrayBuffer(A),
          M1,
          K_BUF
        );
        const M2_ARR = new Uint8Array(M2);
        const lpp = new AuthPacket(
          AuthOpcode.LOGON_PROOF,
          1 + 32 + 20 + 20 + 2
        );
        lpp.writeBytes(Buffer.from(reverseArrayBuffer(A)));
        lpp.writeBytes(Buffer.from(M1));
        lpp.writeBytes(Buffer.from(new Array(20))); // CRC hash
        lpp.writeUInt8(0x00); // number of keys
        lpp.writeUInt8(0x00); // security flags

        return new Promise((resolve, reject) => {
          this.once("packet:receive:LOGON_PROOF", async (ap: AuthPacket) => {
            ap.readUInt8();

            console.info("received proof response");

            const m2 = arrayBufferToBigInt(M2_ARR);
            const M2_raw = ap.readBigInt(20, false);
            const valid = m2 === M2_raw;
            this.emit("authenticate", valid);
            return resolve(valid);
          });
          this.send(lpp);
        });

        break;
      case ChallengeOpcode.ACCOUNT_INVALID:
        throw new Error("account invalid");
      case ChallengeOpcode.BUILD_INVALID:
        throw new Error("build invalid");
      default:
        break;
    }
  }
}
