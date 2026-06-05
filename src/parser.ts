import { arrayBuffersEqual, getEventFlagState, parseToMap, stringToBytes, toHexString, trim } from './util'
import { eventFlags } from './event-flags'
import type { ParseOptions, ProfileSummary, Save, Slot } from './types'
import { createLogger } from './logger'
import { bstFile } from './bst-map'

const USER_10_DATA_START = 0x19003a0
const ACTIVE_PROFILES_START = 0x1901d04
// const PROFILE_SUMMARIES_START = 0x1901d0e
const SLOT_COUNT = 10

/**
 * Parse an Elden Ring save file buffer.
 *
 * @param buffer - The ArrayBuffer containing the save file data
 * @param options - Optional configuration for parsing
 * @param options.logLevel - Log level threshold: 'debug', 'info', 'warn', 'error', or 'none'. Defaults to 'error'
 * @returns A Save object containing parsed slot and profile data
 */
export function parse(buffer: ArrayBuffer, options: ParseOptions = { logLevel: 'error' }): Save {
  const logger = createLogger(options.logLevel)
  const dataView = new DataView(buffer)
  const utf16leDecoder = new TextDecoder('utf-16le')
  const utf8Decoder = new TextDecoder('utf-8')

  let offset = 0

  const save: Save = {}

  // Read Magic Bytes
  const magicBytes = buffer.slice(offset, offset + 4)
  offset += 4

  if (
    !arrayBuffersEqual(magicBytes, new Uint8Array(stringToBytes('BND4')).buffer) &&
    !arrayBuffersEqual(magicBytes, new Uint8Array(stringToBytes('SL2\x00')).buffer)
  ) {
    throw new Error(`File type not supported, magic bytes: ${toHexString(magicBytes)} (${utf8Decoder.decode(magicBytes)})`)
  }

  save.magicBytes = toHexString(magicBytes)

  // Read Header
  const headerSize = 0x2fc
  offset += headerSize

  // Read Slots
  save.slots = []
  for (let i = 0; i < SLOT_COUNT; i++) {
    logger.debug(`Parsing slot ${i}`)

    offset = 0x300 + i * 0x280010

    const slot: Slot = {}
    slot.checksum = toHexString(buffer.slice(offset, offset + 0x10))
    offset += 0x10

    slot.version = dataView.getUint32(offset, true)
    offset += 0x4

    slot.mapId = toHexString(buffer.slice(offset, offset + 0x4))
    offset += 0x4

    // Skip Header
    offset += 24

    // Read GaItems
    logger.debug(`Reading GaItems for slot ${i}`)
    for (let i = 0; i < 0x1400; i++) {
      const gaitemHandle = dataView.getUint32(offset, true)
      offset += 0x4

      // const gaitemId = dataView.getUint32(offset, true)
      offset += 0x4

      // Trick to keep the result as an unsigned int
      const gaitemHandleType = (gaitemHandle & 0xf0000000) >>> 0

      if (gaitemHandle !== 0 && gaitemHandleType !== 0xc0000000) {
        offset += 0x8

        if (gaitemHandleType === 0x80000000) {
          offset += 0x5
        }
      }
    }

    // Read Character
    logger.debug(`Reading character data for slot ${i}`)
    slot.character = {}
    slot.character.unk0x0 = dataView.getUint32(offset, true)
    offset += 4
    slot.character.unk0x4 = dataView.getUint32(offset, true)
    offset += 4
    slot.character.hp = dataView.getUint32(offset, true)
    offset += 4
    slot.character.maxHp = dataView.getUint32(offset, true)
    offset += 4
    slot.character.baseMaxHp = dataView.getUint32(offset, true)
    offset += 4
    slot.character.fp = dataView.getUint32(offset, true)
    offset += 4
    slot.character.maxFp = dataView.getUint32(offset, true)
    offset += 4
    slot.character.baseMaxFp = dataView.getUint32(offset, true)
    offset += 4
    slot.character.unk0x20 = dataView.getUint32(offset, true)
    offset += 4
    slot.character.sp = dataView.getUint32(offset, true)
    offset += 4
    slot.character.maxSp = dataView.getUint32(offset, true)
    offset += 4
    slot.character.baseMaxSp = dataView.getUint32(offset, true)
    offset += 4
    slot.character.unk0x30 = dataView.getUint32(offset, true)
    offset += 4
    slot.character.vigor = dataView.getUint32(offset, true)
    offset += 4
    slot.character.mind = dataView.getUint32(offset, true)
    offset += 4
    slot.character.endurance = dataView.getUint32(offset, true)
    offset += 4
    slot.character.strength = dataView.getUint32(offset, true)
    offset += 4
    slot.character.dexterity = dataView.getUint32(offset, true)
    offset += 4
    slot.character.intelligence = dataView.getUint32(offset, true)
    offset += 4
    slot.character.faith = dataView.getUint32(offset, true)
    offset += 4
    slot.character.arcane = dataView.getUint32(offset, true)
    offset += 4
    slot.character.unk0x54 = dataView.getUint32(offset, true)
    offset += 4
    slot.character.unk0x58 = dataView.getUint32(offset, true)
    offset += 4
    slot.character.unk0x5c = dataView.getUint32(offset, true)
    offset += 4
    slot.character.level = dataView.getUint32(offset, true)
    offset += 4
    slot.character.runes = dataView.getUint32(offset, true)
    offset += 4
    slot.character.runesMemory = dataView.getUint32(offset, true)
    offset += 4
    slot.character.unk0x6c = dataView.getUint32(offset, true)
    offset += 4
    slot.character.poisonBuildup = dataView.getUint32(offset, true)
    offset += 4
    slot.character.rotBuildup = dataView.getUint32(offset, true)
    offset += 4
    slot.character.bleedBuildup = dataView.getUint32(offset, true)
    offset += 4
    slot.character.deathBuildup = dataView.getUint32(offset, true)
    offset += 4
    slot.character.frostBuildup = dataView.getUint32(offset, true)
    offset += 4
    slot.character.sleepBuildup = dataView.getUint32(offset, true)
    offset += 4
    slot.character.madnessBuildup = dataView.getUint32(offset, true)
    offset += 4
    slot.character.unk0x8c = dataView.getUint32(offset, true)
    offset += 4
    slot.character.unk0x90 = dataView.getUint32(offset, true)
    offset += 4
    slot.character.characterName = trim(utf16leDecoder.decode(buffer.slice(offset, offset + 32)))
    offset += 32

    // Skip Terminator
    offset += 2

    slot.character.bodyType = dataView.getUint8(offset++)
    slot.character.archetype = dataView.getUint8(offset++)
    slot.character.unk0xb8 = dataView.getUint8(offset++)
    slot.character.unk0xb9 = dataView.getUint8(offset++)
    slot.character.voiceType = dataView.getUint8(offset++)
    slot.character.gift = dataView.getUint8(offset++)
    slot.character.unk0xbc = dataView.getUint8(offset++)
    slot.character.unk0xbd = dataView.getUint8(offset++)
    slot.character.additionalTalismanSlotCount = dataView.getUint8(offset++)
    slot.character.summonSpiritLevel = dataView.getUint8(offset++)

    // Skip Unknown
    offset += 0x18

    // Skip Online Settings
    offset += 0x21

    // Flask Count
    slot.character.maxCrimsonTearFlaskCount = dataView.getUint8(offset++)
    slot.character.maxCeruleanTearFlaskCount = dataView.getUint8(offset++)

    // Skip Unknown
    offset += 0x15

    // Skip Groups Passwords
    offset += 6 * (2 + 16)

    // Skip Padding
    offset += 0x34

    // Skip SP Effects
    offset += 13 * 16

    // Skip EquippedItemsEquipIndex
    offset += 88

    // Skip ActiveWeaponSlotsAndArmStyle
    offset += 28

    // Skip EquippedItemsItemIds
    offset += 88

    // Skip EquippedItemsGaitemHandles
    offset += 88

    // Skip Inventory
    offset += 16 + 12 * 2688 + 12 * 384

    // Skip EquippedSpells
    offset += 116

    // Skip EquippedItems
    offset += 140

    // Skip EquippedGestures
    offset += 24

    // Read AcquiredProjectiles
    const aquiredProjectilesCount = dataView.getUint32(offset, true)
    offset += 4 + aquiredProjectilesCount * 8
    slot.character.aquiredProjectilesCount = aquiredProjectilesCount

    // Skip EquippedArmamentsAndItems
    offset += 156

    // Skip EquippedPhysics
    offset += 12

    // Skip Face Data
    offset += 303

    // Skip Inventory Storage
    offset += 16 + 12 * 0x780 + 12 * 0x80

    // Skip Gestures
    offset += 256

    // Read Regions
    const regionCount = dataView.getUint32(offset, true)
    offset += 4
    const regionIds = []
    for (let i = 0; i < regionCount; i++) {
      regionIds.push(dataView.getUint32(offset, true))
      offset += 4
    }
    slot.regions = {}
    slot.regions.regionCount = regionCount
    slot.regions.regionIds = regionIds

    // Skip Torrent Data
    offset += 40

    // Skip Control Byte
    offset += 1

    // Skip Bloodstain
    offset += 68

    // Skip Unkown
    offset += 4

    // Skip Unkown
    offset += 4

    // Skip MenuSaveLoad
    offset += 4
    let menuSaveLoadSize = dataView.getUint32(offset, true)
    offset += 4

    if (menuSaveLoadSize > 0x10000 || menuSaveLoadSize < 0) {
      menuSaveLoadSize = 0x1000
    }

    offset += menuSaveLoadSize

    // Skip TrophyEquipData
    offset += 52

    // Skip GaitemGameData
    offset += 0x1b588

    // Skip TutorialData
    offset += 4
    let tutorialDataSize = dataView.getUint32(offset, true)
    offset += 4

    if (tutorialDataSize > 0x10000 || tutorialDataSize < 0) {
      tutorialDataSize = 0x400
    }

    offset += tutorialDataSize

    // Skip Unkown
    offset += 3

    slot.totalDeathCount = dataView.getUint32(offset, true)
    offset += 4

    slot.characterType = dataView.getInt32(offset, true)
    offset += 4

    slot.inOnlineSessionFlag = dataView.getUint8(offset++)

    slot.characterTypeOnline = dataView.getUint32(offset, true)
    offset += 4

    slot.lastRestedGrace = dataView.getUint32(offset, true)
    offset += 4

    slot.notAloneFlag = dataView.getUint8(offset++)

    slot.inGameCountdownTimer = dataView.getUint32(offset, true)
    offset += 4

    // Skip Unknown
    offset += 4

    // Read Event Flags
    logger.debug(`Reading event flags for slot ${i} with offset ${offset}`)
    const EVENT_FLAGS_SIZE = 0x1bf99f
    const eventFlagUint8Array = new Uint8Array(buffer, offset, EVENT_FLAGS_SIZE)

    const bstMap = parseToMap(bstFile)

    const slotEventFlags = []

    for (const eventFlag of eventFlags) {
      const slotEventFlag = structuredClone(eventFlag)
      slotEventFlag.state = getEventFlagState(bstMap, eventFlagUint8Array, eventFlag.id)
      slotEventFlags.push(slotEventFlag)
    }

    slot.eventFlags = slotEventFlags
    offset += 0x1bf99f

    save.slots?.push(slot)
  }

  // Read User_10 Data
  logger.debug('Reading User_10 data')
  offset = USER_10_DATA_START

  save.checksum = toHexString(buffer.slice(offset, offset + 0x10))
  offset += 0x10

  save.version = dataView.getUint32(offset, true)
  offset += 0x4

  save.steamId = dataView.getBigUint64(offset, true).toString()
  offset += 0x8

  // Read Settings
  logger.debug('Reading settings')
  save.settings = {}
  save.settings.cameraSpeed = dataView.getUint8(offset++)
  save.settings.controllerVibration = dataView.getUint8(offset++)
  save.settings.brightness = dataView.getUint8(offset++)
  save.settings.unk0x3 = dataView.getUint8(offset++)
  save.settings.musicVolume = dataView.getUint8(offset++)
  save.settings.soundEffectsVolume = dataView.getUint8(offset++)
  save.settings.voiceVolume = dataView.getUint8(offset++)
  save.settings.displayBlood = dataView.getUint8(offset++)
  save.settings.subtitles = dataView.getUint8(offset++)
  save.settings.hud = dataView.getUint8(offset++)
  save.settings.cameraXAxis = dataView.getUint8(offset++)
  save.settings.cameraYAxis = dataView.getUint8(offset++)
  save.settings.toggle_auto_lockon = dataView.getUint8(offset++)
  save.settings.camera_auto_wall_recovery = dataView.getUint8(offset++)
  save.settings.unk0xe = dataView.getUint8(offset++)
  save.settings.unk0xf = dataView.getUint8(offset++)
  save.settings.reset_camera_y_axis = dataView.getUint8(offset++)
  save.settings.cinematic_effects = dataView.getUint8(offset++)
  save.settings.unk0x12 = dataView.getUint8(offset++)
  save.settings.perform_matchmaking = dataView.getUint8(offset++)
  save.settings.unk0x14 = dataView.getUint8(offset++)
  save.settings.unk0x15 = dataView.getUint8(offset++)
  save.settings.manual_attack_aim = dataView.getUint8(offset++)
  save.settings.autotarget = dataView.getUint8(offset++)
  save.settings.launchsettings = dataView.getUint8(offset++)
  save.settings.send_summon_sign = dataView.getUint8(offset++)
  save.settings.unk0x1a = dataView.getUint8(offset++)
  save.settings.hdr = dataView.getUint8(offset++)
  save.settings.hdr_adjust_brightness = dataView.getUint8(offset++)
  save.settings.hdr_maximum_brightness = dataView.getUint8(offset++)
  save.settings.hdr_adjust_saturation = dataView.getUint8(offset++)
  save.settings.unk0x1f = dataView.getUint8(offset++)
  save.settings.master_volume = dataView.getUint8(offset++)
  save.settings.is_raytracing_on = dataView.getUint8(offset++)
  save.settings.mark_new_items = dataView.getUint8(offset++)
  save.settings.show_recent_tabs = dataView.getUint8(offset++)

  offset = ACTIVE_PROFILES_START
  save.activeProfiles = Array.from({ length: SLOT_COUNT }, () => dataView.getUint8(offset++))

  // Read Profile Summaries
  logger.debug('Reading profile summaries')
  save.profileSummaries = []
  for (let i = 0; i < SLOT_COUNT; i++) {
    const profileSummary: ProfileSummary = {}
    profileSummary.name = trim(utf16leDecoder.decode(buffer.slice(offset, offset + 32)))
    offset += 32

    // Skip Terminator
    offset += 2

    profileSummary.level = dataView.getUint32(offset, true)
    offset += 4

    profileSummary.secondsPlayed = dataView.getUint32(offset, true)
    offset += 4

    profileSummary.runesMemory = dataView.getUint32(offset, true)
    offset += 4

    profileSummary.mapId = toHexString(buffer.slice(offset, offset + 4))
    offset += 4

    profileSummary.unk0x34 = dataView.getUint32(offset, true)
    offset += 0x4

    // Skip Face Data
    offset += 0x124

    // Skip Equipment Data
    offset += 0xe8

    profileSummary.bodyType = dataView.getUint8(offset++)
    profileSummary.archetype = dataView.getUint8(offset++)
    profileSummary.startingGift = dataView.getUint8(offset++)

    // Skip Unknown end
    offset += 0x7

    save.profileSummaries?.push(profileSummary)
  }

  return save
}
