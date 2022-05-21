export enum AuthOpcode {
  LOGON_CHALLENGE = 0x00,
  LOGON_PROOF = 0x01,
  RECONNECT_CHALLENGE = 0x02,
  RECONNECT_PROOF = 0x03,
  REALM_LIST = 0x10,
}

export namespace AuthOpcode {
  export function toString(opcode: AuthOpcode) {
    return Object.keys(AuthOpcode).find(
      (key) => (AuthOpcode as any)[key] === opcode
    ) as string;
  }
}
