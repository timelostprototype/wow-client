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
    ap.writeUnsignedInt(0x00);

    this.session.auth.send(ap);

    return new Promise((resolve) => this.on("refresh", resolve));
  }

  // Realm list refresh handler (REALM_LIST)
  handleRealmList(ap: AuthPacket) {
    ap.readShort(); // packet-size
    ap.readUnsignedInt(); // (?)

    const count = ap.readShort(); // number of realms

    this.list.length = 0;

    for (let i = 0; i < count; ++i) {
      const realm = new Realm();

      realm.icon = ap.readUnsignedByte();
      realm.lock = ap.readUnsignedByte();
      realm.flags = ap.readUnsignedByte();
      realm.name = ap.readCString();
      realm.address = ap.readCString();
      realm.population = ap.readFloat();
      realm.characters = ap.readUnsignedByte();
      realm.timezone = ap.readUnsignedByte();
      realm.id = ap.readUnsignedByte();

      // TODO: Introduce magic constants such as REALM_FLAG_SPECIFYBUILD
      if (realm.flags & 0x04) {
        realm.majorVersion = ap.readUnsignedByte();
        realm.minorVersion = ap.readUnsignedByte();
        realm.patchVersion = ap.readUnsignedByte();
        realm.build = ap.readUnsignedShort();
      }

      this.list.push(realm);
    }

    this.emit("refresh");
  }
}
