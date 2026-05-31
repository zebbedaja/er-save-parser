# ER Save Parser

![CI](https://github.com/zebbedaja/er-save-parser/actions/workflows/ci.yml/badge.svg)
[![npm version](https://img.shields.io/npm/v/@zebbedaja/er-save-parser)](https://www.npmjs.com/package/@zebbedaja/er-save-parser)
[![npm downloads](https://img.shields.io/npm/dm/@zebbedaja/er-save-parser)](https://www.npmjs.com/package/@zebbedaja/er-save-parser)
![npm package minimized gzipped size](https://img.shields.io/bundlejs/size/%40zebbedaja%2Fer-save-parser)
[![license](https://img.shields.io/badge/license-MIT-blue)](LICENSE)

Parse Elden Ring PC save files into structured TypeScript/JavaScript objects.

## Features

- **Full save slot parsing** — all 10 slots with character data, attributes, Flask counts, regions visited, death count, and more
- **Event flag decoding** — track boss defeats, quest progress, and ending states
- **Settings extraction** — camera, audio, HDR, ray tracing, and other game settings
- **Profile summaries** — character name, level, play time, starting gift, and archetype per slot
- **Zero runtime dependencies** — pure ESM, no bundled dependencies

## Installation

```bash
npm install @zebbedaja/er-save-parser
```

## Usage

### Node

#### TypeScript

```typescript
import { parse, type Save, type Slot, type Character } from '@zebbedaja/er-save-parser'
import { readFileSync } from 'fs'

const buffer = readFileSync('ER0000.sl2').buffer
const save: Save = parse(buffer)

console.log(save.steamId)
console.log(save.settings?.hud)

const slot: Slot | undefined = save.slots?.[0]
const char: Character | undefined = slot?.character

if (char) {
  console.log(char.characterName)    // "Tarnished"
  console.log(char.level)            // 150
  console.log(char.runes)            // 1234567
  console.log(char.strength)         // 45
  console.log(char.faith)            // 30
  console.log(char.arcane)           // 20
}

// Check boss defeats
slot?.eventFlags?.forEach((flag) => {
  if (flag.state) {
    console.log(`${flag.name} ✓`)
  }
})
```

#### JavaScript

```javascript
import { parse } from '@zebbedaja/er-save-parser'
import { readFileSync } from 'node:fs'

const buffer = readFileSync('ER0000.sl2').buffer
const save = parse(buffer)

console.log(save.steamId)
console.log(save.settings?.hud)

const slot = save.slots?.[0]
const char = slot?.character

if (char) {
  console.log(char.characterName)    // "Tarnished"
  console.log(char.level)            // 150
  console.log(char.runes)            // 1234567
  console.log(char.strength)         // 45
  console.log(char.faith)            // 30
  console.log(char.arcane)           // 20
}

// Check boss defeats
slot?.eventFlags?.forEach((flag) => {
  if (flag.state) {
    console.log(`${flag.name} ✓`)
  }
})
```

### Reading from a file in the browser

#### TypeScript

```typescript
async function parseFromFile(file: File): Promise<Save> {
  const buffer = await file.arrayBuffer()
  return parse(buffer)
}
```

#### JavaScript

```javascript
async function parseFromFile(file) {
  const buffer = await file.arrayBuffer()
  return parse(buffer)
}
```

## Parsed Data

### `Save` (root)
| Field | Type | Description |
|---|---|---|
| `magicBytes` | `string` | Hex string, e.g. `424e4434` (`BND4`) |
| `checksum` | `string` | Save file checksum |
| `version` | `number` | Save file version |
| `steamId` | `string` | Associated Steam64 ID |
| `settings` | `Settings` | Game settings (camera, audio, HDR, ray tracing…) |
| `activeProfiles` | `number[]` | Active profile flags per slot |
| `profileSummaries` | `ProfileSummary[]` | Name, level, play time per slot |
| `slots` | `Slot[]` | Up to 10 save slots (see below) |

### `Slot`
| Field | Type | Description |
|---|---|---|
| `checksum` | `string` | Slot-level checksum |
| `version` | `number` | Slot version |
| `mapId` | `string` | Current location map ID (hex) |
| `character` | `Character` | Full character data |
| `regions` | `object` | Regions visited ({ `regionCount`, `regionIds` }) |
| `totalDeathCount` | `number` | Cumulative deaths across playthroughs |
| `characterType` | `number` | Save type indicator |
| `inOnlineSessionFlag` | `number` | Online session flag |
| `lastRestedGrace` | `number` | Last grace site rested at |
| `notAloneFlag` | `number` | Co-op phantoms present |
| `inGameCountdownTimer` | `number` | Online timeout countdown |
| `eventFlags` | `EventFlag[]` | Boss defeats, quest progress, endings |

### `Character`
| Field | Type | Description |
|---|---|---|
| `characterName` | `string` | In-game name |
| `level` | `number` | Character level |
| `runes` | `number` | Current runes (currency) |
| `runesMemory` | `number` | Maximum runes that can be held |
| `hp` / `maxHp` / `baseMaxHp` | `number` | HP current / max / base max |
| `fp` / `maxFp` / `baseMaxFp` | `number` | FP current / max / base max |
| `sp` / `maxSp` / `baseMaxSp` | `number` | Stamina current / max / base max |
| `vigor` / `mind` / `endurance` | `number` | ATTRIBUTE: Vigor / Mind / Endurance |
| `strength` / `dexterity` / `intelligence` / `faith` / `arcane` | `number` | ATTRIBUTE: STR / DEX / INT / FTH / ARC |
| `poisonBuildup` | `number` | Current poison status effect |
| `rotBuildup` | `number` | Current scarlet rot status effect |
| `bleedBuildup` | `number` | Current hemorrhage status effect |
| `frostBuildup` | `number` | Current frozen status effect |
| `madnessBuildup` | `number` | Current madness status effect |
| `bodyType` | `number` | Body type selection index |
| `voiceType` | `number` | Voice type selection index |
| `archetype` | `number` | Starting class selection index |
| `gift` | `number` | Starting gift selection index |
| `maxCrimsonTearFlaskCount` | `number` | Flask of Crimson Tears quantity |
| `maxCeruleanTearFlaskCount` | `number` | Flask of Cerulean Tears quantity |
| `additionalTalismanSlotCount` | `number` | Extra talisman slots unlocked |
| `summonSpiritLevel` | `number` | Spirit Ash upgrade level |
| `aquiredProjectilesCount` | `number` | Acquired projectile count |

### `Settings`
| Field | Type | Description |
|---|---|---|
| `cameraSpeed` | `number` | Camera rotation speed |
| `brightness` | `number` | Display brightness |
| `musicVolume` | `number` | Music volume |
| `soundEffectsVolume` | `number` | SFX volume |
| `voiceVolume` | `number` | Dialogue/voice volume |
| `master_volume` | `number` | Master volume |
| `hud` | `number` | HUD visibility |
| `subtitles` | `number` | Subtitle toggle |
| `displayBlood` | `number` | Gore/display filter |
| `hdr` | `number` | HDR toggle |
| `is_raytracing_on` | `number` | Ray tracing toggle |
| `autotarget` | `number` | Auto-aim toggle |
| `cameraXAxis` / `cameraYAxis` | `number` | Camera axis configuration |
| `perform_matchmaking` | `number` | Online matchmaking toggle |
| ... | | (and more) |

### `EventFlag`
| Field | Type | Description |
|---|---|---|
| `name` | `string` | Human-readable name (e.g., `"Godrick the Grafted"`) |
| `id` | `number` | Internal game event ID |
| `category` | `string` | Category: `boss`, `ending`, `quest`, etc. |
| `location` | `string` | Location (if applicable) |
| `state` | `boolean` | `true` if triggered |

## Error handling

The parser will throw an Error if:
- The file magic bytes don't match `BND4` or `SL2\x00`
- Event flags reference blocks not found in the BST map
- Calculated byte positions exceed save data bounds

## Development

```bash
npm install       # Install dependencies
npm run test      # Run Vitest suite
npm run typecheck # Run TypeScript type check
npm run build     # Bundle with tsdown
npm run dev       # Watch mode
```

## TODO

- Read all event flags
- Read equipment
- Read inventory

## License

MIT

## Credits

- [Hapfel1/er-save-manager](https://github.com/Hapfel1/er-save-manager) — Python-based save manager/editor with GUI, backup, teleportation, and community features
- [ClayAmore/ER-Save-Lib](https://github.com/ClayAmore/ER-Save-Lib) — Rust library for reading/writing save files with PC and PlayStation support
- [ClayAmore/ER-Save-Editor](https://github.com/ClayAmore/ER-Save-Editor) — Full-featured Rust save editor for PC and PlayStation save files
- [EthanShoeDev/elden-ring-compass](https://github.com/EthanShoeDev/elden-ring-compass) — React-based progress tracker with interactive map and save file polling
- [CyberGiant7/Elden-Ring-Automatic-Checklist](https://github.com/CyberGiant7/Elden-Ring-Automatic-Checklist) — Online tool that analyzes save files to track 100% completion and missing items
- [vawser/Smithbox](https://github.com/vawser/Smithbox) — Comprehensive modding tool for FromSoftware games with param, map, model, and material editors
- [soulsmodding.com](https://soulsmodding.com) — FromSoftware save file documentation and reverse engineering resources
