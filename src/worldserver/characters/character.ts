import { GUID } from "../guid";

export interface Pet {
  model: number;
  level: number;
  family: number;
}

export interface Item {
  model: number;
  type: number;
  enchantment: number;
}

export class Character {
  public guid: GUID;
  public name: string;
  public race: number;
  public class: number;
  public gender: number;
  public bytes: number;
  public facial: number;
  public level: number;
  public zone: number;
  public map: number;
  public x: number;
  public y: number;
  public z: number;
  public guild: number;
  public flags: number;

  public pet?: Pet;

  public equipment: Item[];

  // Short string representation of this character
  toString() {
    return `[Character; GUID: ${this.guid}]`;
  }
}
