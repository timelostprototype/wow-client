import { Buffer } from "buffer";

import { ChallengeOpcode } from "./challenge-opcode";
import { AuthOpcode } from "./opcode";
import { AuthPacket } from "./packet";

import { RealmServer } from "../realmserver";
import { LogonChallengePacket, SRP } from "../../common/crypto/srp";

export class AuthHandler {
  constructor(private realmServer: RealmServer) {}

  private prepareAuthRequestPacket() {
    const {
      build,
      majorVersion,
      minorVersion,
      patchVersion,
      game,
      raw: { os, locale, platform },
      timezone,
    } = this.realmServer.clientConfig;

    const account = this.realmServer.config.account.toUpperCase();

    const ap = new AuthPacket(
      AuthOpcode.LOGON_CHALLENGE,
      4 + 29 + 1 + account.length
    );
    ap.writeUInt8(0x00);
    ap.writeUInt16LE(30 + account.length);

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
    ap.writeUInt8(account.length); // account length
    ap.writeBytes(Buffer.from(account)); // account

    return ap;
  }

  private decodeLogonChallenge(ap: AuthPacket): LogonChallengePacket {
    const packet: LogonChallengePacket = {
      status: -1,
      B: BigInt(-1),
      g: BigInt(-1),
      N: BigInt(-1),
      salt: BigInt(-1),
    };
    ap.readUInt8();
    packet.status = ap.readUInt8();
    if (packet.status === ChallengeOpcode.SUCCESS) {
      packet.B = ap.readBigInt(32, false);
      const glen = ap.readUInt8(); // g-length
      packet.g = ap.readBigInt(glen); // g

      const Nlen = ap.readUInt8(); // n-length
      packet.N = ap.readBigInt(Nlen); // N

      packet.salt = ap.readBigInt(32, false); // salt

      ap.readBytes(16); // unknown
      ap.readUInt8(); // security flags
    }

    return packet;
  }

  async authenticate(): Promise<Uint8Array> {
    const account = this.realmServer.config.account.toUpperCase();
    const password = this.realmServer.config.password.toUpperCase();

    return new Promise((resolve, reject) => {
      this.realmServer.once(
        "packet:receive:LOGON_CHALLENGE",
        async (ap: AuthPacket) => {
          const packet = this.decodeLogonChallenge(ap);

          switch (packet.status) {
            case ChallengeOpcode.SUCCESS:
              const srp = new SRP(account, password);
              const srpResult = await srp.calculate(packet);
              const lpp = new AuthPacket(
                AuthOpcode.LOGON_PROOF,
                1 + 32 + 20 + 20 + 2
              );
              lpp.writeBytes(srpResult.A);
              lpp.writeBytes(srpResult.M1);
              lpp.writeBytes(Buffer.from(new Array(20))); // CRC hash
              lpp.writeUInt8(0x00); // number of keys
              lpp.writeUInt8(0x00); // security flags

              this.realmServer.once(
                "packet:receive:LOGON_PROOF",
                async (ap: AuthPacket) => {
                  ap.readUInt8();
                  const M2_raw = ap.readBigInt(20, false);
                  const valid = srpResult.M2 === M2_raw;

                  if (valid) {
                    resolve(srpResult.key);
                  } else {
                    reject();
                  }
                }
              );

              this.realmServer.send(lpp);

              break;
            case ChallengeOpcode.ACCOUNT_INVALID:
              reject("account invalid");
            case ChallengeOpcode.BUILD_INVALID:
              reject("build invalid");
            default:
              reject(packet.status);
          }
        }
      );
      this.realmServer.send(this.prepareAuthRequestPacket());
    });
  }
}
