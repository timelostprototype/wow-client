export class Realm {
  // Holds host, port and address
  public _host?: string;
  public _port?: number;
  public _address?: string;

  // Holds realm attributes
  public name?: string;
  public id?: number;
  public icon?: number;
  public lock?: number;
  public flags?: number;
  public timezone?: number;
  public population?: number = 0.0;
  public characters?: number = 0;

  public majorVersion?: number;
  public minorVersion?: number;
  public patchVersion?: number;
  public build?: number;

  // Creates a new realm
  constructor() {}

  // Short string representation of this realm
  toString() {
    return `[Realm; Name: ${this.name}; Address: ${this._address}; Characters: ${this.characters}]`;
  }

  // Retrieves host for this realm
  get host(): string {
    return this._host!;
  }

  // Retrieves port for this realm
  get port(): number {
    return this._port!;
  }

  // Retrieves address for this realm
  get address(): string {
    return this._address!;
  }

  // Sets address for this realm
  set address(address: string) {
    this._address = address;
    const parts = address.split(":");
    this._host = parts[0] || undefined;
    this._port = parseInt(parts[1], 10) || NaN;
  }
}
