import { EventEmitter } from "events";

import { AuthOpcode } from "../auth/opcode";
import { AuthPacket } from "../auth/packet";
import { Client } from "../client";
import { Realm } from "./realm";

export class RealmsHandler extends EventEmitter {
  public list: Realm[] = [];
  // Creates a new realm handler
  constructor(private session: Client) {
    super();

    // Listen for realm list
    this.session.auth.on("packet:receive:REALM_LIST", (ap) =>
      this.handleRealmList(ap)
    );
  }

  // Requests a fresh list of realms
  async refresh() {
    console.info("refreshing realmlist");

    const ap = new AuthPacket(AuthOpcode.REALM_LIST, 1 + 4);

    // Per WoWDev, the opcode is followed by an unknown uint32
    ap.writeUInt32LE(0x00);

    this.session.auth.send(ap);

    return new Promise((resolve) => this.on("refresh", resolve));
  }

  // Realm list refresh handler (REALM_LIST)
  handleRealmList(ap: AuthPacket) {
    ap.readUInt16LE(); // packet-size
    ap.readUInt32LE(); // (?)

    const count = ap.readUInt16LE(); // number of realms

    this.list.length = 0;

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

      this.list.push(realm);
    }

    this.emit("refresh");
  }
}
