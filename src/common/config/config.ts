import { AddonInfo } from "./addon-info";

export class Config {
  public game = "WoW";
  public build = 12340;
  public version = "3.3.5";
  public timezone = 0;
  public locale = "enUS";
  public os = "Win";
  public platform = "x86";

  public majorVersion = 0;
  public minorVersion = 0;
  public patchVersion = 0;

  public addonInfo = new AddonInfo();

  constructor() {
    [this.majorVersion, this.minorVersion, this.patchVersion] = this.version
      .split(".")
      .map(function (bit) {
        return parseInt(bit, 10);
      });
  }
}
