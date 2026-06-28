export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'none'

export interface ParseOptions {
  logLevel?: LogLevel
  includeEventFlagUInt8Array?: boolean
}

export interface Save {
  magicBytes?: string
  checksum?: string
  version?: number
  slots?: Slot[]
  steamId?: string
  settings?: Settings
  activeProfiles?: number[]
  profileSummaries?: ProfileSummary[]
}

export interface Settings {
  cameraSpeed?: number
  controllerVibration?: number
  brightness?: number
  unk0x3?: number
  musicVolume?: number
  soundEffectsVolume?: number
  voiceVolume?: number
  displayBlood?: number
  subtitles?: number
  hud?: number
  cameraXAxis?: number
  cameraYAxis?: number
  toggle_auto_lockon?: number
  camera_auto_wall_recovery?: number
  unk0xe?: number
  unk0xf?: number
  reset_camera_y_axis?: number
  cinematic_effects?: number
  unk0x12?: number
  perform_matchmaking?: number
  unk0x14?: number
  unk0x15?: number
  manual_attack_aim?: number
  autotarget?: number
  launchsettings?: number
  send_summon_sign?: number
  unk0x1a?: number
  hdr?: number
  hdr_adjust_brightness?: number
  hdr_maximum_brightness?: number
  hdr_adjust_saturation?: number
  unk0x1f?: number
  master_volume?: number
  is_raytracing_on?: number
  mark_new_items?: number
  show_recent_tabs?: number
}

export interface ProfileSummary {
  name?: string
  level?: number
  secondsPlayed?: number
  runesMemory?: number
  mapId?: string
  unk0x34?: number
  bodyType?: number
  archetype?: number
  startingGift?: number
}

export interface Slot {
  checksum?: string
  version?: number
  mapId?: string
  character?: Character
  regions?: { regionCount?: number; regionIds?: number[] }
  totalDeathCount?: number
  characterType?: number
  inOnlineSessionFlag?: number
  characterTypeOnline?: number
  lastRestedGrace?: number
  notAloneFlag?: number
  inGameCountdownTimer?: number
  eventFlags?: EventFlag[]
  eventFlagUint8Array?: Uint8Array
}

export interface Character {
  unk0x0?: number
  unk0x4?: number
  hp?: number
  maxHp?: number
  baseMaxHp?: number
  fp?: number
  maxFp?: number
  baseMaxFp?: number
  unk0x20?: number
  sp?: number
  maxSp?: number
  baseMaxSp?: number
  unk0x30?: number
  vigor?: number
  mind?: number
  endurance?: number
  strength?: number
  dexterity?: number
  intelligence?: number
  faith?: number
  arcane?: number
  unk0x54?: number
  unk0x58?: number
  unk0x5c?: number
  level?: number
  runes?: number
  runesMemory?: number
  unk0x6c?: number
  poisonBuildup?: number
  rotBuildup?: number
  bleedBuildup?: number
  deathBuildup?: number
  frostBuildup?: number
  sleepBuildup?: number
  madnessBuildup?: number
  unk0x8c?: number
  unk0x90?: number
  characterName?: string
  bodyType?: number
  archetype?: number
  unk0xb8?: number
  unk0xb9?: number
  voiceType?: number
  gift?: number
  unk0xbc?: number
  unk0xbd?: number
  additionalTalismanSlotCount?: number
  summonSpiritLevel?: number
  unk0xc0?: number
  maxCrimsonTearFlaskCount?: number
  maxCeruleanTearFlaskCount?: number
  aquiredProjectilesCount?: number
}

export interface EventFlag {
  name: string
  id: number
  category?: string
  location?: string
  state?: boolean
}

export interface BitDifference {
  offset: number
  bitIndex: number // 0 = LSB, 7 = MSB
  oldBit: 0 | 1
  newBit: 0 | 1
}

export interface Offset {
  bytePos: number,
  bitIndex: number
}

export interface MapName {
  id: string,
  name: string
}