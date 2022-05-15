import * as EventEmitter from "events";

class Entity extends EventEmitter {
  public guid: number;
  constructor() {
    super();
    this.guid = (Math.random() * 1000000) | 0;
  }
}
