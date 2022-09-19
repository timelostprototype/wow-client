# Typescript WoW Client

**⚠️ This is an early work-in-progress implementation, expect major breaking changes until version 1.0.0**

This is a headless client library for World of Warcraft written in Typescript, currently supporting version 3.3.5 (WotLK). This is intended to be used with third party server implementations such as TrinityCore or AzerothCore, and is not expected to be compatible with Blizzard's WoW classic.

## Quickstart

`npm i @timelostprototype/wow-client`

```ts
import { Client, Message } from "@timelostprototype/wow-client";

const client = new Client(
  "logon.example.com", //Realmlist
  "myusername",
  "mypassword"
);

//expect event names to change in the near future
client.worldServer.on("message", (msg: Message) => {
  //msg.logLine converts WoW color codes etc into ASNI escape codes for the terminal
  console.log(msg.logLine);
});

async function bootstrap() {
  //helper function for quick start, may go away
  await client.connectToFirstRealmWithFirstCharacter();
}
bootstrap();
```

## Currently implemented features

- Authentication against realmserver and worldserver
- Listing of realms and characters
- Joining a worldserver with a character and keeping connection alive with ping / time sync
- Sending and receiving chat messages, including addon messages
  - Channel
  - Emote
  - Guild
  - Officer
  - Say
  - Yell
  - Whisper
- /who queries
- Adding and removing a player from friends

## Roadmap

- Support for more operations
  - Auction House
  - Bank
  - Mail
  - Guild
  - and potentially many others
- Support for other server versions
  - Ideally packet encoders / decoders should automatically switch behaviour based on realm version
- Decoding of more server message types to events
- Support for more complex actions
  - Movement
  - Combat
