import { deflate, inflate, constants } from "zlib";
import { promisify } from "util";

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

export interface Addon {
  name: string;
  flags: number;
  modulusCrc: number;
  urlCrc: number;
}

export class AddonInfo {
  public lastModified = 1636457673;
  public addons: Addon[] = [
    { name: "Blizzard_AchievementUI", flags: 0, modulusCrc: 0, urlCrc: 0 },
    { name: "Blizzard_ArenaUI", flags: 0, modulusCrc: 0, urlCrc: 0 },
    { name: "Blizzard_AuctionUI", flags: 0, modulusCrc: 0, urlCrc: 0 },
    { name: "Blizzard_BarbershopUI", flags: 0, modulusCrc: 0, urlCrc: 0 },
    { name: "Blizzard_BattlefieldMinimap", flags: 0, modulusCrc: 0, urlCrc: 0 },
    {
      name: "Blizzard_BindingUI",
      flags: 225,
      modulusCrc: 1276933997,
      urlCrc: 0,
    },
    { name: "Blizzard_Calendar", flags: 0, modulusCrc: 0, urlCrc: 0 },
    { name: "Blizzard_CombatLog", flags: 0, modulusCrc: 0, urlCrc: 0 },
    { name: "Blizzard_CombatText", flags: 0, modulusCrc: 0, urlCrc: 0 },
    { name: "Blizzard_DebugTools", flags: 0, modulusCrc: 0, urlCrc: 0 },
    { name: "Blizzard_GlyphUI", flags: 0, modulusCrc: 0, urlCrc: 0 },
    { name: "Blizzard_GMChatUI", flags: 0, modulusCrc: 0, urlCrc: 0 },
    { name: "Blizzard_GMSurveyUI", flags: 0, modulusCrc: 0, urlCrc: 0 },
    { name: "Blizzard_GuildBankUI", flags: 0, modulusCrc: 0, urlCrc: 0 },
    {
      name: "Blizzard_InspectUI",
      flags: 92,
      modulusCrc: 1276933997,
      urlCrc: 0,
    },
    { name: "Blizzard_ItemSocketingUI", flags: 0, modulusCrc: 0, urlCrc: 0 },
    { name: "Blizzard_MacroUI", flags: 31, modulusCrc: 1276933997, urlCrc: 0 },
    { name: "Blizzard_RaidUI", flags: 201, modulusCrc: 1276933997, urlCrc: 0 },
    { name: "Blizzard_TalentUI", flags: 0, modulusCrc: 0, urlCrc: 0 },
    { name: "Blizzard_TimeManager", flags: 0, modulusCrc: 0, urlCrc: 0 },
    { name: "Blizzard_TokenUI", flags: 0, modulusCrc: 0, urlCrc: 0 },
    { name: "Blizzard_TradeSkillUI", flags: 0, modulusCrc: 0, urlCrc: 0 },
    { name: "Blizzard_TrainerUI", flags: 0, modulusCrc: 0, urlCrc: 0 },
  ];

  async compress() {
    const addonInfo: number[] = [this.addons.length, 0, 0, 0];
    for (const addon of this.addons) {
      for (var i = 0; i < addon.name.length; i++) {
        addonInfo.push(addon.name.charCodeAt(i));
      }
      addonInfo.push(0);
      addonInfo.push(addon.flags);
      addonInfo.push(...this.toBytesInt32(addon.modulusCrc));
      addonInfo.push(...this.toBytesInt32(addon.urlCrc));
    }
    addonInfo.push(...this.toBytesInt32(this.lastModified));
    return promisify(deflate)(new Uint8Array(addonInfo), {
      level: constants.Z_BEST_COMPRESSION,
    });
  }

  private toBytesInt32(num: number) {
    const arr = new ArrayBuffer(4);
    const view = new DataView(arr);
    view.setUint32(0, num, true);
    return new Uint8Array(arr);
  }
}
