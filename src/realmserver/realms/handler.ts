import { AuthOpcode } from "../auth/opcode";
import { AuthPacket } from "../auth/packet";
import { Realm } from "./realm";
import { RealmServer } from "../realmserver";

export class RealmsHandler {
  constructor(private realmServer: RealmServer) {}

  async list(): Promise<Realm[]> {
    return new Promise((resolve, reject) => {
      this.realmServer.on("packet:receive:REALM_LIST", (ap) => {
        ap.readUInt16LE(); // packet-size
        ap.readUInt32LE(); // (?)

        const count = ap.readUInt16LE(); // number of realms

        const list = [];

        for (let i = 0; i < count; ++i) {
          const realm = new Realm();

          realm.icon = ap.readUInt8();
          realm.lock = ap.readUInt8();
          realm.flags = ap.readUInt8();
          realm.name = ap.readRawString();
          realm.address = ap.readRawString();
          realm.population = ap.readUInt32LE();
          realm.characters = ap.readUInt8();
          realm.timezone = ap.readUInt8();
          realm.id = ap.readUInt8();

          // TODO: Introduce magic constants such as REALM_FLAG_SPECIFYBUILD
          if (realm.flags & 0x04) {
            realm.majorVersion = ap.readUInt8();
            realm.minorVersion = ap.readUInt8();
            realm.patchVersion = ap.readUInt8();
            realm.build = ap.readUInt8();
          }

          list.push(realm);
        }
        resolve(list);
      });

      const ap = new AuthPacket(AuthOpcode.REALM_LIST, 1 + 4);
      // Per WoWDev, the opcode is followed by an unknown uint32
      ap.writeUInt32LE(0x00);
      this.realmServer.socket.send(ap);
    });
  }
}
