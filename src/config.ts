export class Config {
  public game = "Wow ";
  public build = 12340;
  public version = "3.3.5";
  public timezone = 0;
  public locale = "enUS";
  public os = "Win";
  public platform = "x86";

  public majorVersion = 0;
  public minorVersion = 0;
  public patchVersion = 0;

  public raw: Raw;

  constructor() {
    this.raw = new Raw(this);

    [this.majorVersion, this.minorVersion, this.patchVersion] = this.version
      .split(".")
      .map(function (bit) {
        return parseInt(bit, 10);
      });
  }
}

export class Raw {
  constructor(private config: Config) {
    this.config = config;
  }

  raw(value: string) {
    return (value.split("").reverse().join("") + "\u0000").slice(0, 4);
  }

  get locale() {
    return this.raw(this.config.locale);
  }

  get os() {
    return this.raw(this.config.os);
  }

  get platform() {
    return this.raw(this.config.platform);
  }
}
