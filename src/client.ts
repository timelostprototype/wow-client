import { EventEmitter } from "events";

import { AuthHandler } from "./auth/handler";
import { CharacterHandler } from "./characters/handler";
import { Config } from "./config";
import { GameHandler } from "./game/handler";
import { JoinWorldQuery } from "./game/query/join-world";
import { RealmsHandler } from "./realms/handler";

export class Client extends EventEmitter {
  public config: Config;
  public auth: AuthHandler;
  public realms: RealmsHandler;
  public game: GameHandler;
  public characters: CharacterHandler;

  constructor(
    private realmlist: string,
    private username: string,
    private password: string
  ) {
    super();

    this.config = new Config();
    this.auth = new AuthHandler(this);
    this.realms = new RealmsHandler(this);
    this.game = new GameHandler(this);
    this.characters = new CharacterHandler(this);
  }

  async connectToFirstRealmWithFirstCharacter() {
    await this.auth.connect(this.realmlist);
    await this.auth.authenticate(this.username, this.password);
    console.log("🔑 Authenticated");
    await this.realms.refresh();
    const realms = this.realms.list;
    const realm1 = realms[0];
    this.game.realmId = realm1.id;
    await this.game.connect(realm1.host, realm1.port);

    await this.characters.refresh();
    const characters = this.characters.list;

    await new JoinWorldQuery(this.game).join(characters[0]);
  }
}
