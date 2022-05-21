import { EventEmitter } from "events";

import { Config } from "./config";
import { RealmServer } from "./realmserver/realmserver";
import { JoinWorldQuery } from "./worldserver/query/join-world";
import { WorldServer } from "./worldserver/worldserver";

export class Client {
  public config: Config;
  public realmServer: RealmServer;
  public worldServer: WorldServer;

  constructor(host: string, account: string, password: string) {
    this.config = new Config();
    this.realmServer = new RealmServer(
      { host, account, password },
      this.config
    );
    this.worldServer = new WorldServer({ account }, this.config);
  }

  async connectToFirstRealmWithFirstCharacter() {
    await this.realmServer.connect();
    console.log("🔑 Authenticated");
    const realms = this.realmServer.realms;
    const realm1 = realms[0];
    await this.worldServer.connect(realm1, this.realmServer.key!);

    const character1 = this.worldServer.characters[0];
    await new JoinWorldQuery(this.worldServer).join(character1);
  }
}
