import type {CatalogItem,Item} from './tracker';
export const hardwareCategories=['Consoles','PCs','Handhelds','Controllers','VR headsets','Accessories'] as const;
export type HardwareCategory=typeof hardwareCategories[number];
export const hardwareCatalog:CatalogItem[]=[
  {
    "id": "hw-nintendo-entertainment-system",
    "title": "Nintendo Entertainment System",
    "platform": "Nintendo",
    "subtitle": "Nintendo · Consoles",
    "kind": "console",
    "hardwareCategory": "Consoles",
    "edition": "Standard"
  },
  {
    "id": "hw-super-nintendo-entertainment-system",
    "title": "Super Nintendo Entertainment System",
    "platform": "Nintendo",
    "subtitle": "Nintendo · Consoles",
    "kind": "console",
    "hardwareCategory": "Consoles",
    "edition": "Standard"
  },
  {
    "id": "hw-nintendo-64",
    "title": "Nintendo 64",
    "platform": "Nintendo",
    "subtitle": "Nintendo · Consoles",
    "kind": "console",
    "hardwareCategory": "Consoles",
    "edition": "Standard"
  },
  {
    "id": "hw-nintendo-gamecube",
    "title": "Nintendo GameCube",
    "platform": "Nintendo",
    "subtitle": "Nintendo · Consoles",
    "kind": "console",
    "hardwareCategory": "Consoles",
    "edition": "Standard"
  },
  {
    "id": "hw-nintendo-wii",
    "title": "Nintendo Wii",
    "platform": "Nintendo",
    "subtitle": "Nintendo · Consoles",
    "kind": "console",
    "hardwareCategory": "Consoles",
    "edition": "Standard"
  },
  {
    "id": "hw-nintendo-wii-u",
    "title": "Nintendo Wii U",
    "platform": "Nintendo",
    "subtitle": "Nintendo · Consoles",
    "kind": "console",
    "hardwareCategory": "Consoles",
    "edition": "Standard"
  },
  {
    "id": "hw-nintendo-switch",
    "title": "Nintendo Switch",
    "platform": "Nintendo",
    "subtitle": "Nintendo · Consoles",
    "kind": "console",
    "hardwareCategory": "Consoles",
    "edition": "Standard"
  },
  {
    "id": "switch-oled",
    "title": "Nintendo Switch OLED",
    "platform": "Nintendo",
    "subtitle": "Nintendo · Consoles",
    "kind": "console",
    "hardwareCategory": "Consoles",
    "edition": "Standard"
  },
  {
    "id": "hw-nintendo-switch-2",
    "title": "Nintendo Switch 2",
    "platform": "Nintendo",
    "subtitle": "Nintendo · Consoles",
    "kind": "console",
    "hardwareCategory": "Consoles",
    "edition": "Standard"
  },
  {
    "id": "hw-playstation",
    "title": "PlayStation",
    "platform": "PlayStation",
    "subtitle": "PlayStation · Consoles",
    "kind": "console",
    "hardwareCategory": "Consoles",
    "edition": "Standard"
  },
  {
    "id": "hw-ps-one",
    "title": "PS one",
    "platform": "PlayStation",
    "subtitle": "PlayStation · Consoles",
    "kind": "console",
    "hardwareCategory": "Consoles",
    "edition": "Standard"
  },
  {
    "id": "ps2",
    "title": "PlayStation 2",
    "platform": "PlayStation",
    "subtitle": "PlayStation · Consoles",
    "kind": "console",
    "hardwareCategory": "Consoles",
    "edition": "Standard"
  },
  {
    "id": "hw-playstation-2-slim",
    "title": "PlayStation 2 Slim",
    "platform": "PlayStation",
    "subtitle": "PlayStation · Consoles",
    "kind": "console",
    "hardwareCategory": "Consoles",
    "edition": "Standard"
  },
  {
    "id": "hw-playstation-3",
    "title": "PlayStation 3",
    "platform": "PlayStation",
    "subtitle": "PlayStation · Consoles",
    "kind": "console",
    "hardwareCategory": "Consoles",
    "edition": "Standard"
  },
  {
    "id": "hw-playstation-3-slim",
    "title": "PlayStation 3 Slim",
    "platform": "PlayStation",
    "subtitle": "PlayStation · Consoles",
    "kind": "console",
    "hardwareCategory": "Consoles",
    "edition": "Standard"
  },
  {
    "id": "hw-playstation-3-super-slim",
    "title": "PlayStation 3 Super Slim",
    "platform": "PlayStation",
    "subtitle": "PlayStation · Consoles",
    "kind": "console",
    "hardwareCategory": "Consoles",
    "edition": "Standard"
  },
  {
    "id": "hw-playstation-4",
    "title": "PlayStation 4",
    "platform": "PlayStation",
    "subtitle": "PlayStation · Consoles",
    "kind": "console",
    "hardwareCategory": "Consoles",
    "edition": "Standard"
  },
  {
    "id": "hw-playstation-4-slim",
    "title": "PlayStation 4 Slim",
    "platform": "PlayStation",
    "subtitle": "PlayStation · Consoles",
    "kind": "console",
    "hardwareCategory": "Consoles",
    "edition": "Standard"
  },
  {
    "id": "hw-playstation-4-pro",
    "title": "PlayStation 4 Pro",
    "platform": "PlayStation",
    "subtitle": "PlayStation · Consoles",
    "kind": "console",
    "hardwareCategory": "Consoles",
    "edition": "Standard"
  },
  {
    "id": "ps5",
    "title": "PlayStation 5",
    "platform": "PlayStation",
    "subtitle": "PlayStation · Consoles",
    "kind": "console",
    "hardwareCategory": "Consoles",
    "edition": "Standard"
  },
  {
    "id": "hw-playstation-5-digital-edition",
    "title": "PlayStation 5 Digital Edition",
    "platform": "PlayStation",
    "subtitle": "PlayStation · Consoles",
    "kind": "console",
    "hardwareCategory": "Consoles",
    "edition": "Standard"
  },
  {
    "id": "hw-playstation-5-slim",
    "title": "PlayStation 5 Slim",
    "platform": "PlayStation",
    "subtitle": "PlayStation · Consoles",
    "kind": "console",
    "hardwareCategory": "Consoles",
    "edition": "Standard"
  },
  {
    "id": "hw-playstation-5-pro",
    "title": "PlayStation 5 Pro",
    "platform": "PlayStation",
    "subtitle": "PlayStation · Consoles",
    "kind": "console",
    "hardwareCategory": "Consoles",
    "edition": "Standard"
  },
  {
    "id": "hw-xbox",
    "title": "Xbox",
    "platform": "Xbox",
    "subtitle": "Xbox · Consoles",
    "kind": "console",
    "hardwareCategory": "Consoles",
    "edition": "Standard"
  },
  {
    "id": "hw-xbox-360",
    "title": "Xbox 360",
    "platform": "Xbox",
    "subtitle": "Xbox · Consoles",
    "kind": "console",
    "hardwareCategory": "Consoles",
    "edition": "Standard"
  },
  {
    "id": "hw-xbox-360-s",
    "title": "Xbox 360 S",
    "platform": "Xbox",
    "subtitle": "Xbox · Consoles",
    "kind": "console",
    "hardwareCategory": "Consoles",
    "edition": "Standard"
  },
  {
    "id": "hw-xbox-360-e",
    "title": "Xbox 360 E",
    "platform": "Xbox",
    "subtitle": "Xbox · Consoles",
    "kind": "console",
    "hardwareCategory": "Consoles",
    "edition": "Standard"
  },
  {
    "id": "hw-xbox-one",
    "title": "Xbox One",
    "platform": "Xbox",
    "subtitle": "Xbox · Consoles",
    "kind": "console",
    "hardwareCategory": "Consoles",
    "edition": "Standard"
  },
  {
    "id": "hw-xbox-one-s",
    "title": "Xbox One S",
    "platform": "Xbox",
    "subtitle": "Xbox · Consoles",
    "kind": "console",
    "hardwareCategory": "Consoles",
    "edition": "Standard"
  },
  {
    "id": "hw-xbox-one-x",
    "title": "Xbox One X",
    "platform": "Xbox",
    "subtitle": "Xbox · Consoles",
    "kind": "console",
    "hardwareCategory": "Consoles",
    "edition": "Standard"
  },
  {
    "id": "series-s",
    "title": "Xbox Series S",
    "platform": "Xbox",
    "subtitle": "Xbox · Consoles",
    "kind": "console",
    "hardwareCategory": "Consoles",
    "edition": "Standard"
  },
  {
    "id": "series-x",
    "title": "Xbox Series X",
    "platform": "Xbox",
    "subtitle": "Xbox · Consoles",
    "kind": "console",
    "hardwareCategory": "Consoles",
    "edition": "Standard"
  },
  {
    "id": "hw-sega-master-system",
    "title": "Sega Master System",
    "platform": "Sega",
    "subtitle": "Sega · Consoles",
    "kind": "console",
    "hardwareCategory": "Consoles",
    "edition": "Standard"
  },
  {
    "id": "hw-sega-genesis-mega-drive",
    "title": "Sega Genesis / Mega Drive",
    "platform": "Sega",
    "subtitle": "Sega · Consoles",
    "kind": "console",
    "hardwareCategory": "Consoles",
    "edition": "Standard"
  },
  {
    "id": "hw-sega-cd-mega-cd",
    "title": "Sega CD / Mega-CD",
    "platform": "Sega",
    "subtitle": "Sega · Consoles",
    "kind": "console",
    "hardwareCategory": "Consoles",
    "edition": "Standard"
  },
  {
    "id": "hw-sega-32x",
    "title": "Sega 32X",
    "platform": "Sega",
    "subtitle": "Sega · Consoles",
    "kind": "console",
    "hardwareCategory": "Consoles",
    "edition": "Standard"
  },
  {
    "id": "hw-sega-saturn",
    "title": "Sega Saturn",
    "platform": "Sega",
    "subtitle": "Sega · Consoles",
    "kind": "console",
    "hardwareCategory": "Consoles",
    "edition": "Standard"
  },
  {
    "id": "hw-sega-dreamcast",
    "title": "Sega Dreamcast",
    "platform": "Sega",
    "subtitle": "Sega · Consoles",
    "kind": "console",
    "hardwareCategory": "Consoles",
    "edition": "Standard"
  },
  {
    "id": "hw-atari-2600",
    "title": "Atari 2600",
    "platform": "Atari",
    "subtitle": "Atari · Consoles",
    "kind": "console",
    "hardwareCategory": "Consoles",
    "edition": "Standard"
  },
  {
    "id": "hw-atari-5200",
    "title": "Atari 5200",
    "platform": "Atari",
    "subtitle": "Atari · Consoles",
    "kind": "console",
    "hardwareCategory": "Consoles",
    "edition": "Standard"
  },
  {
    "id": "hw-atari-7800",
    "title": "Atari 7800",
    "platform": "Atari",
    "subtitle": "Atari · Consoles",
    "kind": "console",
    "hardwareCategory": "Consoles",
    "edition": "Standard"
  },
  {
    "id": "hw-atari-jaguar",
    "title": "Atari Jaguar",
    "platform": "Atari",
    "subtitle": "Atari · Consoles",
    "kind": "console",
    "hardwareCategory": "Consoles",
    "edition": "Standard"
  },
  {
    "id": "hw-atari-2600-plus",
    "title": "Atari 2600+",
    "platform": "Atari",
    "subtitle": "Atari · Consoles",
    "kind": "console",
    "hardwareCategory": "Consoles",
    "edition": "Standard"
  },
  {
    "id": "hw-turbografx-16-pc-engine",
    "title": "TurboGrafx-16 / PC Engine",
    "platform": "NEC",
    "subtitle": "NEC · Consoles",
    "kind": "console",
    "hardwareCategory": "Consoles",
    "edition": "Standard"
  },
  {
    "id": "hw-neo-geo-aes",
    "title": "Neo Geo AES",
    "platform": "SNK",
    "subtitle": "SNK · Consoles",
    "kind": "console",
    "hardwareCategory": "Consoles",
    "edition": "Standard"
  },
  {
    "id": "hw-analogue-nt-mini",
    "title": "Analogue Nt mini",
    "platform": "Analogue",
    "subtitle": "Analogue · Consoles",
    "kind": "console",
    "hardwareCategory": "Consoles",
    "edition": "Standard"
  },
  {
    "id": "hw-analogue-super-nt",
    "title": "Analogue Super Nt",
    "platform": "Analogue",
    "subtitle": "Analogue · Consoles",
    "kind": "console",
    "hardwareCategory": "Consoles",
    "edition": "Standard"
  },
  {
    "id": "hw-analogue-mega-sg",
    "title": "Analogue Mega Sg",
    "platform": "Analogue",
    "subtitle": "Analogue · Consoles",
    "kind": "console",
    "hardwareCategory": "Consoles",
    "edition": "Standard"
  },
  {
    "id": "hw-analogue-duo",
    "title": "Analogue Duo",
    "platform": "Analogue",
    "subtitle": "Analogue · Consoles",
    "kind": "console",
    "hardwareCategory": "Consoles",
    "edition": "Standard"
  },
  {
    "id": "hw-game-boy",
    "title": "Game Boy",
    "platform": "Nintendo",
    "subtitle": "Nintendo · Handhelds",
    "kind": "console",
    "hardwareCategory": "Handhelds",
    "edition": "Standard"
  },
  {
    "id": "hw-game-boy-pocket",
    "title": "Game Boy Pocket",
    "platform": "Nintendo",
    "subtitle": "Nintendo · Handhelds",
    "kind": "console",
    "hardwareCategory": "Handhelds",
    "edition": "Standard"
  },
  {
    "id": "hw-game-boy-color",
    "title": "Game Boy Color",
    "platform": "Nintendo",
    "subtitle": "Nintendo · Handhelds",
    "kind": "console",
    "hardwareCategory": "Handhelds",
    "edition": "Standard"
  },
  {
    "id": "hw-game-boy-advance",
    "title": "Game Boy Advance",
    "platform": "Nintendo",
    "subtitle": "Nintendo · Handhelds",
    "kind": "console",
    "hardwareCategory": "Handhelds",
    "edition": "Standard"
  },
  {
    "id": "gameboy",
    "title": "Game Boy Advance SP",
    "platform": "Nintendo",
    "subtitle": "Nintendo · Handhelds",
    "kind": "console",
    "hardwareCategory": "Handhelds",
    "edition": "Standard"
  },
  {
    "id": "hw-game-boy-micro",
    "title": "Game Boy Micro",
    "platform": "Nintendo",
    "subtitle": "Nintendo · Handhelds",
    "kind": "console",
    "hardwareCategory": "Handhelds",
    "edition": "Standard"
  },
  {
    "id": "hw-nintendo-ds",
    "title": "Nintendo DS",
    "platform": "Nintendo",
    "subtitle": "Nintendo · Handhelds",
    "kind": "console",
    "hardwareCategory": "Handhelds",
    "edition": "Standard"
  },
  {
    "id": "hw-nintendo-ds-lite",
    "title": "Nintendo DS Lite",
    "platform": "Nintendo",
    "subtitle": "Nintendo · Handhelds",
    "kind": "console",
    "hardwareCategory": "Handhelds",
    "edition": "Standard"
  },
  {
    "id": "hw-nintendo-dsi",
    "title": "Nintendo DSi",
    "platform": "Nintendo",
    "subtitle": "Nintendo · Handhelds",
    "kind": "console",
    "hardwareCategory": "Handhelds",
    "edition": "Standard"
  },
  {
    "id": "hw-nintendo-dsi-xl",
    "title": "Nintendo DSi XL",
    "platform": "Nintendo",
    "subtitle": "Nintendo · Handhelds",
    "kind": "console",
    "hardwareCategory": "Handhelds",
    "edition": "Standard"
  },
  {
    "id": "hw-nintendo-3ds",
    "title": "Nintendo 3DS",
    "platform": "Nintendo",
    "subtitle": "Nintendo · Handhelds",
    "kind": "console",
    "hardwareCategory": "Handhelds",
    "edition": "Standard"
  },
  {
    "id": "hw-nintendo-3ds-xl",
    "title": "Nintendo 3DS XL",
    "platform": "Nintendo",
    "subtitle": "Nintendo · Handhelds",
    "kind": "console",
    "hardwareCategory": "Handhelds",
    "edition": "Standard"
  },
  {
    "id": "hw-nintendo-2ds",
    "title": "Nintendo 2DS",
    "platform": "Nintendo",
    "subtitle": "Nintendo · Handhelds",
    "kind": "console",
    "hardwareCategory": "Handhelds",
    "edition": "Standard"
  },
  {
    "id": "hw-new-nintendo-3ds",
    "title": "New Nintendo 3DS",
    "platform": "Nintendo",
    "subtitle": "Nintendo · Handhelds",
    "kind": "console",
    "hardwareCategory": "Handhelds",
    "edition": "Standard"
  },
  {
    "id": "hw-new-nintendo-3ds-xl",
    "title": "New Nintendo 3DS XL",
    "platform": "Nintendo",
    "subtitle": "Nintendo · Handhelds",
    "kind": "console",
    "hardwareCategory": "Handhelds",
    "edition": "Standard"
  },
  {
    "id": "hw-new-nintendo-2ds-xl",
    "title": "New Nintendo 2DS XL",
    "platform": "Nintendo",
    "subtitle": "Nintendo · Handhelds",
    "kind": "console",
    "hardwareCategory": "Handhelds",
    "edition": "Standard"
  },
  {
    "id": "switch-lite",
    "title": "Nintendo Switch Lite",
    "platform": "Nintendo",
    "subtitle": "Nintendo · Handhelds",
    "kind": "console",
    "hardwareCategory": "Handhelds",
    "edition": "Standard"
  },
  {
    "id": "hw-playstation-portable-psp-1000",
    "title": "PlayStation Portable PSP-1000",
    "platform": "PlayStation",
    "subtitle": "PlayStation · Handhelds",
    "kind": "console",
    "hardwareCategory": "Handhelds",
    "edition": "Standard"
  },
  {
    "id": "hw-playstation-portable-psp-2000",
    "title": "PlayStation Portable PSP-2000",
    "platform": "PlayStation",
    "subtitle": "PlayStation · Handhelds",
    "kind": "console",
    "hardwareCategory": "Handhelds",
    "edition": "Standard"
  },
  {
    "id": "hw-playstation-portable-psp-3000",
    "title": "PlayStation Portable PSP-3000",
    "platform": "PlayStation",
    "subtitle": "PlayStation · Handhelds",
    "kind": "console",
    "hardwareCategory": "Handhelds",
    "edition": "Standard"
  },
  {
    "id": "hw-psp-go",
    "title": "PSP Go",
    "platform": "PlayStation",
    "subtitle": "PlayStation · Handhelds",
    "kind": "console",
    "hardwareCategory": "Handhelds",
    "edition": "Standard"
  },
  {
    "id": "hw-playstation-vita",
    "title": "PlayStation Vita",
    "platform": "PlayStation",
    "subtitle": "PlayStation · Handhelds",
    "kind": "console",
    "hardwareCategory": "Handhelds",
    "edition": "Standard"
  },
  {
    "id": "hw-playstation-vita-slim",
    "title": "PlayStation Vita Slim",
    "platform": "PlayStation",
    "subtitle": "PlayStation · Handhelds",
    "kind": "console",
    "hardwareCategory": "Handhelds",
    "edition": "Standard"
  },
  {
    "id": "hw-playstation-portal",
    "title": "PlayStation Portal",
    "platform": "PlayStation",
    "subtitle": "PlayStation · Handhelds",
    "kind": "console",
    "hardwareCategory": "Handhelds",
    "edition": "Standard"
  },
  {
    "id": "hw-sega-game-gear",
    "title": "Sega Game Gear",
    "platform": "Sega",
    "subtitle": "Sega · Handhelds",
    "kind": "console",
    "hardwareCategory": "Handhelds",
    "edition": "Standard"
  },
  {
    "id": "hw-sega-nomad",
    "title": "Sega Nomad",
    "platform": "Sega",
    "subtitle": "Sega · Handhelds",
    "kind": "console",
    "hardwareCategory": "Handhelds",
    "edition": "Standard"
  },
  {
    "id": "hw-atari-lynx",
    "title": "Atari Lynx",
    "platform": "Atari",
    "subtitle": "Atari · Handhelds",
    "kind": "console",
    "hardwareCategory": "Handhelds",
    "edition": "Standard"
  },
  {
    "id": "hw-neo-geo-pocket",
    "title": "Neo Geo Pocket",
    "platform": "SNK",
    "subtitle": "SNK · Handhelds",
    "kind": "console",
    "hardwareCategory": "Handhelds",
    "edition": "Standard"
  },
  {
    "id": "hw-neo-geo-pocket-color",
    "title": "Neo Geo Pocket Color",
    "platform": "SNK",
    "subtitle": "SNK · Handhelds",
    "kind": "console",
    "hardwareCategory": "Handhelds",
    "edition": "Standard"
  },
  {
    "id": "hw-wonderswan",
    "title": "WonderSwan",
    "platform": "Bandai",
    "subtitle": "Bandai · Handhelds",
    "kind": "console",
    "hardwareCategory": "Handhelds",
    "edition": "Standard"
  },
  {
    "id": "hw-wonderswan-color",
    "title": "WonderSwan Color",
    "platform": "Bandai",
    "subtitle": "Bandai · Handhelds",
    "kind": "console",
    "hardwareCategory": "Handhelds",
    "edition": "Standard"
  },
  {
    "id": "hw-steam-deck-lcd",
    "title": "Steam Deck LCD",
    "platform": "Valve",
    "subtitle": "Valve · PC handheld",
    "kind": "console",
    "hardwareCategory": "Handhelds",
    "edition": "Standard"
  },
  {
    "id": "steam-deck",
    "title": "Steam Deck OLED",
    "platform": "Valve",
    "subtitle": "Valve · PC handheld",
    "kind": "console",
    "hardwareCategory": "Handhelds",
    "edition": "Standard"
  },
  {
    "id": "hw-rog-ally",
    "title": "ROG Ally",
    "platform": "ASUS",
    "subtitle": "ASUS · PC handheld",
    "kind": "console",
    "hardwareCategory": "Handhelds",
    "edition": "Standard"
  },
  {
    "id": "hw-rog-ally-x",
    "title": "ROG Ally X",
    "platform": "ASUS",
    "subtitle": "ASUS · PC handheld",
    "kind": "console",
    "hardwareCategory": "Handhelds",
    "edition": "Standard"
  },
  {
    "id": "hw-rog-xbox-ally",
    "title": "ROG Xbox Ally",
    "platform": "ASUS",
    "subtitle": "ASUS · PC handheld",
    "kind": "console",
    "hardwareCategory": "Handhelds",
    "edition": "Standard"
  },
  {
    "id": "hw-rog-xbox-ally-x",
    "title": "ROG Xbox Ally X",
    "platform": "ASUS",
    "subtitle": "ASUS · PC handheld",
    "kind": "console",
    "hardwareCategory": "Handhelds",
    "edition": "Standard"
  },
  {
    "id": "hw-legion-go",
    "title": "Legion Go",
    "platform": "Lenovo",
    "subtitle": "Lenovo · PC handheld",
    "kind": "console",
    "hardwareCategory": "Handhelds",
    "edition": "Standard"
  },
  {
    "id": "hw-legion-go-s",
    "title": "Legion Go S",
    "platform": "Lenovo",
    "subtitle": "Lenovo · PC handheld",
    "kind": "console",
    "hardwareCategory": "Handhelds",
    "edition": "Standard"
  },
  {
    "id": "hw-claw-a1m",
    "title": "Claw A1M",
    "platform": "MSI",
    "subtitle": "MSI · PC handheld",
    "kind": "console",
    "hardwareCategory": "Handhelds",
    "edition": "Standard"
  },
  {
    "id": "hw-retroid-pocket-2s",
    "title": "Retroid Pocket 2S",
    "platform": "Retroid",
    "subtitle": "Retroid · Android handheld",
    "kind": "console",
    "hardwareCategory": "Handhelds",
    "edition": "Standard"
  },
  {
    "id": "hw-retroid-pocket-3",
    "title": "Retroid Pocket 3+",
    "platform": "Retroid",
    "subtitle": "Retroid · Android handheld",
    "kind": "console",
    "hardwareCategory": "Handhelds",
    "edition": "Standard"
  },
  {
    "id": "hw-retroid-pocket-4",
    "title": "Retroid Pocket 4",
    "platform": "Retroid",
    "subtitle": "Retroid · Android handheld",
    "kind": "console",
    "hardwareCategory": "Handhelds",
    "edition": "Standard"
  },
  {
    "id": "hw-retroid-pocket-4-pro",
    "title": "Retroid Pocket 4 Pro",
    "platform": "Retroid",
    "subtitle": "Retroid · Android handheld",
    "kind": "console",
    "hardwareCategory": "Handhelds",
    "edition": "Standard"
  },
  {
    "id": "hw-retroid-pocket-5",
    "title": "Retroid Pocket 5",
    "platform": "Retroid",
    "subtitle": "Retroid · Android handheld",
    "kind": "console",
    "hardwareCategory": "Handhelds",
    "edition": "Standard"
  },
  {
    "id": "hw-retroid-pocket-mini",
    "title": "Retroid Pocket Mini",
    "platform": "Retroid",
    "subtitle": "Retroid · Android handheld",
    "kind": "console",
    "hardwareCategory": "Handhelds",
    "edition": "Standard"
  },
  {
    "id": "hw-odin",
    "title": "Odin",
    "platform": "AYN",
    "subtitle": "AYN · Android handheld",
    "kind": "console",
    "hardwareCategory": "Handhelds",
    "edition": "Standard"
  },
  {
    "id": "hw-odin-lite",
    "title": "Odin Lite",
    "platform": "AYN",
    "subtitle": "AYN · Android handheld",
    "kind": "console",
    "hardwareCategory": "Handhelds",
    "edition": "Standard"
  },
  {
    "id": "hw-odin-2",
    "title": "Odin 2",
    "platform": "AYN",
    "subtitle": "AYN · Android handheld",
    "kind": "console",
    "hardwareCategory": "Handhelds",
    "edition": "Standard"
  },
  {
    "id": "hw-odin-2-mini",
    "title": "Odin 2 Mini",
    "platform": "AYN",
    "subtitle": "AYN · Android handheld",
    "kind": "console",
    "hardwareCategory": "Handhelds",
    "edition": "Standard"
  },
  {
    "id": "hw-g-cloud",
    "title": "G Cloud",
    "platform": "Logitech",
    "subtitle": "Logitech · Android handheld",
    "kind": "console",
    "hardwareCategory": "Handhelds",
    "edition": "Standard"
  },
  {
    "id": "hw-playdate",
    "title": "Playdate",
    "platform": "Panic",
    "subtitle": "Panic · Handhelds",
    "kind": "console",
    "hardwareCategory": "Handhelds",
    "edition": "Standard"
  },
  {
    "id": "hw-analogue-pocket",
    "title": "Analogue Pocket",
    "platform": "Analogue",
    "subtitle": "Analogue · Handhelds",
    "kind": "console",
    "hardwareCategory": "Handhelds",
    "edition": "Standard"
  },
  {
    "id": "hw-evercade-exp",
    "title": "Evercade EXP",
    "platform": "Evercade",
    "subtitle": "Evercade · Handhelds",
    "kind": "console",
    "hardwareCategory": "Handhelds",
    "edition": "Standard"
  },
  {
    "id": "hw-evercade-exp-r",
    "title": "Evercade EXP-R",
    "platform": "Evercade",
    "subtitle": "Evercade · Handhelds",
    "kind": "console",
    "hardwareCategory": "Handhelds",
    "edition": "Standard"
  },
  {
    "id": "hw-nes-controller",
    "title": "NES Controller",
    "platform": "Nintendo",
    "subtitle": "Nintendo · Controllers",
    "kind": "console",
    "hardwareCategory": "Controllers",
    "edition": "Standard"
  },
  {
    "id": "hw-super-nes-controller",
    "title": "Super NES Controller",
    "platform": "Nintendo",
    "subtitle": "Nintendo · Controllers",
    "kind": "console",
    "hardwareCategory": "Controllers",
    "edition": "Standard"
  },
  {
    "id": "hw-nintendo-64-controller",
    "title": "Nintendo 64 Controller",
    "platform": "Nintendo",
    "subtitle": "Nintendo · Controllers",
    "kind": "console",
    "hardwareCategory": "Controllers",
    "edition": "Standard"
  },
  {
    "id": "hw-gamecube-controller",
    "title": "GameCube Controller",
    "platform": "Nintendo",
    "subtitle": "Nintendo · Controllers",
    "kind": "console",
    "hardwareCategory": "Controllers",
    "edition": "Standard"
  },
  {
    "id": "hw-wii-remote",
    "title": "Wii Remote",
    "platform": "Nintendo",
    "subtitle": "Nintendo · Controllers",
    "kind": "console",
    "hardwareCategory": "Controllers",
    "edition": "Standard"
  },
  {
    "id": "hw-wii-remote-plus",
    "title": "Wii Remote Plus",
    "platform": "Nintendo",
    "subtitle": "Nintendo · Controllers",
    "kind": "console",
    "hardwareCategory": "Controllers",
    "edition": "Standard"
  },
  {
    "id": "hw-wii-u-pro-controller",
    "title": "Wii U Pro Controller",
    "platform": "Nintendo",
    "subtitle": "Nintendo · Controllers",
    "kind": "console",
    "hardwareCategory": "Controllers",
    "edition": "Standard"
  },
  {
    "id": "hw-joy-con",
    "title": "Joy-Con",
    "platform": "Nintendo",
    "subtitle": "Nintendo · Controllers",
    "kind": "console",
    "hardwareCategory": "Controllers",
    "edition": "Standard"
  },
  {
    "id": "hw-nintendo-switch-pro-controller",
    "title": "Nintendo Switch Pro Controller",
    "platform": "Nintendo",
    "subtitle": "Nintendo · Controllers",
    "kind": "console",
    "hardwareCategory": "Controllers",
    "edition": "Standard"
  },
  {
    "id": "hw-nintendo-switch-2-pro-controller",
    "title": "Nintendo Switch 2 Pro Controller",
    "platform": "Nintendo",
    "subtitle": "Nintendo · Controllers",
    "kind": "console",
    "hardwareCategory": "Controllers",
    "edition": "Standard"
  },
  {
    "id": "hw-nintendo-switch-pro-controller-the-legend-of-zelda-tears-of-the-kingdom-edition",
    "title": "Nintendo Switch Pro Controller — The Legend of Zelda: Tears of the Kingdom Edition",
    "platform": "Nintendo",
    "subtitle": "Nintendo · Controllers",
    "kind": "console",
    "hardwareCategory": "Controllers",
    "edition": "The Legend of Zelda: Tears of the Kingdom Edition"
  },
  {
    "id": "hw-dualshock",
    "title": "DualShock",
    "platform": "PlayStation",
    "subtitle": "PlayStation · Controllers",
    "kind": "console",
    "hardwareCategory": "Controllers",
    "edition": "Standard"
  },
  {
    "id": "hw-dualshock-2",
    "title": "DualShock 2",
    "platform": "PlayStation",
    "subtitle": "PlayStation · Controllers",
    "kind": "console",
    "hardwareCategory": "Controllers",
    "edition": "Standard"
  },
  {
    "id": "hw-dualshock-3",
    "title": "DualShock 3",
    "platform": "PlayStation",
    "subtitle": "PlayStation · Controllers",
    "kind": "console",
    "hardwareCategory": "Controllers",
    "edition": "Standard"
  },
  {
    "id": "hw-dualshock-4",
    "title": "DualShock 4",
    "platform": "PlayStation",
    "subtitle": "PlayStation · Controllers",
    "kind": "console",
    "hardwareCategory": "Controllers",
    "edition": "Standard"
  },
  {
    "id": "hw-dualsense",
    "title": "DualSense",
    "platform": "PlayStation",
    "subtitle": "PlayStation · Controllers",
    "kind": "console",
    "hardwareCategory": "Controllers",
    "edition": "Standard"
  },
  {
    "id": "hw-dualsense-edge",
    "title": "DualSense Edge",
    "platform": "PlayStation",
    "subtitle": "PlayStation · Controllers",
    "kind": "console",
    "hardwareCategory": "Controllers",
    "edition": "Standard"
  },
  {
    "id": "hw-dualsense-astro-bot-limited-edition",
    "title": "DualSense — Astro Bot Limited Edition",
    "platform": "PlayStation",
    "subtitle": "PlayStation · Controllers",
    "kind": "console",
    "hardwareCategory": "Controllers",
    "edition": "Astro Bot Limited Edition"
  },
  {
    "id": "hw-dualsense-30th-anniversary-limited-edition",
    "title": "DualSense — 30th Anniversary Limited Edition",
    "platform": "PlayStation",
    "subtitle": "PlayStation · Controllers",
    "kind": "console",
    "hardwareCategory": "Controllers",
    "edition": "30th Anniversary Limited Edition"
  },
  {
    "id": "hw-dualsense-the-last-of-us-limited-edition",
    "title": "DualSense — The Last of Us Limited Edition",
    "platform": "PlayStation",
    "subtitle": "PlayStation · Controllers",
    "kind": "console",
    "hardwareCategory": "Controllers",
    "edition": "The Last of Us Limited Edition"
  },
  {
    "id": "hw-xbox-controller-s",
    "title": "Xbox Controller S",
    "platform": "Xbox",
    "subtitle": "Xbox · Controllers",
    "kind": "console",
    "hardwareCategory": "Controllers",
    "edition": "Standard"
  },
  {
    "id": "hw-xbox-360-wireless-controller",
    "title": "Xbox 360 Wireless Controller",
    "platform": "Xbox",
    "subtitle": "Xbox · Controllers",
    "kind": "console",
    "hardwareCategory": "Controllers",
    "edition": "Standard"
  },
  {
    "id": "hw-xbox-wireless-controller",
    "title": "Xbox Wireless Controller",
    "platform": "Xbox",
    "subtitle": "Xbox · Controllers",
    "kind": "console",
    "hardwareCategory": "Controllers",
    "edition": "Standard"
  },
  {
    "id": "hw-xbox-elite-wireless-controller-series-2",
    "title": "Xbox Elite Wireless Controller Series 2",
    "platform": "Xbox",
    "subtitle": "Xbox · Controllers",
    "kind": "console",
    "hardwareCategory": "Controllers",
    "edition": "Standard"
  },
  {
    "id": "hw-xbox-wireless-controller-starfield-limited-edition",
    "title": "Xbox Wireless Controller — Starfield Limited Edition",
    "platform": "Xbox",
    "subtitle": "Xbox · Controllers",
    "kind": "console",
    "hardwareCategory": "Controllers",
    "edition": "Starfield Limited Edition"
  },
  {
    "id": "hw-xbox-wireless-controller-forza-horizon-5-limited-edition",
    "title": "Xbox Wireless Controller — Forza Horizon 5 Limited Edition",
    "platform": "Xbox",
    "subtitle": "Xbox · Controllers",
    "kind": "console",
    "hardwareCategory": "Controllers",
    "edition": "Forza Horizon 5 Limited Edition"
  },
  {
    "id": "hw-8bitdo-pro-2",
    "title": "8BitDo Pro 2",
    "platform": "8BitDo",
    "subtitle": "8BitDo · Controllers",
    "kind": "console",
    "hardwareCategory": "Controllers",
    "edition": "Standard"
  },
  {
    "id": "hw-8bitdo-ultimate-bluetooth-controller",
    "title": "8BitDo Ultimate Bluetooth Controller",
    "platform": "8BitDo",
    "subtitle": "8BitDo · Controllers",
    "kind": "console",
    "hardwareCategory": "Controllers",
    "edition": "Standard"
  },
  {
    "id": "hw-8bitdo-sn30-pro",
    "title": "8BitDo SN30 Pro",
    "platform": "8BitDo",
    "subtitle": "8BitDo · Controllers",
    "kind": "console",
    "hardwareCategory": "Controllers",
    "edition": "Standard"
  },
  {
    "id": "hw-steam-controller",
    "title": "Steam Controller",
    "platform": "Valve",
    "subtitle": "Valve · Controllers",
    "kind": "console",
    "hardwareCategory": "Controllers",
    "edition": "Standard"
  },
  {
    "id": "hw-access-controller",
    "title": "Access Controller",
    "platform": "Sony",
    "subtitle": "Sony · Controllers",
    "kind": "console",
    "hardwareCategory": "Controllers",
    "edition": "Standard"
  },
  {
    "id": "hw-xbox-adaptive-controller",
    "title": "Xbox Adaptive Controller",
    "platform": "Microsoft",
    "subtitle": "Microsoft · Controllers",
    "kind": "console",
    "hardwareCategory": "Controllers",
    "edition": "Standard"
  },
  {
    "id": "hw-oculus-rift",
    "title": "Oculus Rift",
    "platform": "Meta",
    "subtitle": "Meta · VR headsets",
    "kind": "console",
    "hardwareCategory": "VR headsets",
    "edition": "Standard"
  },
  {
    "id": "hw-oculus-rift-s",
    "title": "Oculus Rift S",
    "platform": "Meta",
    "subtitle": "Meta · VR headsets",
    "kind": "console",
    "hardwareCategory": "VR headsets",
    "edition": "Standard"
  },
  {
    "id": "hw-oculus-quest",
    "title": "Oculus Quest",
    "platform": "Meta",
    "subtitle": "Meta · VR headsets",
    "kind": "console",
    "hardwareCategory": "VR headsets",
    "edition": "Standard"
  },
  {
    "id": "hw-meta-quest-2",
    "title": "Meta Quest 2",
    "platform": "Meta",
    "subtitle": "Meta · VR headsets",
    "kind": "console",
    "hardwareCategory": "VR headsets",
    "edition": "Standard"
  },
  {
    "id": "hw-meta-quest-3",
    "title": "Meta Quest 3",
    "platform": "Meta",
    "subtitle": "Meta · VR headsets",
    "kind": "console",
    "hardwareCategory": "VR headsets",
    "edition": "Standard"
  },
  {
    "id": "hw-meta-quest-3s",
    "title": "Meta Quest 3S",
    "platform": "Meta",
    "subtitle": "Meta · VR headsets",
    "kind": "console",
    "hardwareCategory": "VR headsets",
    "edition": "Standard"
  },
  {
    "id": "hw-meta-quest-pro",
    "title": "Meta Quest Pro",
    "platform": "Meta",
    "subtitle": "Meta · VR headsets",
    "kind": "console",
    "hardwareCategory": "VR headsets",
    "edition": "Standard"
  },
  {
    "id": "hw-playstation-vr",
    "title": "PlayStation VR",
    "platform": "PlayStation",
    "subtitle": "PlayStation · VR headsets",
    "kind": "console",
    "hardwareCategory": "VR headsets",
    "edition": "Standard"
  },
  {
    "id": "hw-playstation-vr2",
    "title": "PlayStation VR2",
    "platform": "PlayStation",
    "subtitle": "PlayStation · VR headsets",
    "kind": "console",
    "hardwareCategory": "VR headsets",
    "edition": "Standard"
  },
  {
    "id": "hw-valve-index",
    "title": "Valve Index",
    "platform": "Valve",
    "subtitle": "Valve · VR headsets",
    "kind": "console",
    "hardwareCategory": "VR headsets",
    "edition": "Standard"
  },
  {
    "id": "hw-vive",
    "title": "VIVE",
    "platform": "HTC",
    "subtitle": "HTC · VR headsets",
    "kind": "console",
    "hardwareCategory": "VR headsets",
    "edition": "Standard"
  },
  {
    "id": "hw-vive-pro",
    "title": "VIVE Pro",
    "platform": "HTC",
    "subtitle": "HTC · VR headsets",
    "kind": "console",
    "hardwareCategory": "VR headsets",
    "edition": "Standard"
  },
  {
    "id": "hw-vive-pro-2",
    "title": "VIVE Pro 2",
    "platform": "HTC",
    "subtitle": "HTC · VR headsets",
    "kind": "console",
    "hardwareCategory": "VR headsets",
    "edition": "Standard"
  },
  {
    "id": "hw-vive-xr-elite",
    "title": "VIVE XR Elite",
    "platform": "HTC",
    "subtitle": "HTC · VR headsets",
    "kind": "console",
    "hardwareCategory": "VR headsets",
    "edition": "Standard"
  },
  {
    "id": "hw-pico-4",
    "title": "PICO 4",
    "platform": "PICO",
    "subtitle": "PICO · VR headsets",
    "kind": "console",
    "hardwareCategory": "VR headsets",
    "edition": "Standard"
  },
  {
    "id": "hw-reverb-g2",
    "title": "Reverb G2",
    "platform": "HP",
    "subtitle": "HP · VR headsets",
    "kind": "console",
    "hardwareCategory": "VR headsets",
    "edition": "Standard"
  },
  {
    "id": "hw-nintendo-switch-dock",
    "title": "Nintendo Switch Dock",
    "platform": "Nintendo",
    "subtitle": "Nintendo · Accessories",
    "kind": "console",
    "hardwareCategory": "Accessories",
    "edition": "Standard"
  },
  {
    "id": "hw-nintendo-switch-oled-dock",
    "title": "Nintendo Switch OLED Dock",
    "platform": "Nintendo",
    "subtitle": "Nintendo · Accessories",
    "kind": "console",
    "hardwareCategory": "Accessories",
    "edition": "Standard"
  },
  {
    "id": "hw-nintendo-switch-ac-adapter",
    "title": "Nintendo Switch AC Adapter",
    "platform": "Nintendo",
    "subtitle": "Nintendo · Accessories",
    "kind": "console",
    "hardwareCategory": "Accessories",
    "edition": "Standard"
  },
  {
    "id": "hw-joy-con-charging-grip",
    "title": "Joy-Con Charging Grip",
    "platform": "Nintendo",
    "subtitle": "Nintendo · Accessories",
    "kind": "console",
    "hardwareCategory": "Accessories",
    "edition": "Standard"
  },
  {
    "id": "hw-wii-nunchuk",
    "title": "Wii Nunchuk",
    "platform": "Nintendo",
    "subtitle": "Nintendo · Accessories",
    "kind": "console",
    "hardwareCategory": "Accessories",
    "edition": "Standard"
  },
  {
    "id": "hw-wii-balance-board",
    "title": "Wii Balance Board",
    "platform": "Nintendo",
    "subtitle": "Nintendo · Accessories",
    "kind": "console",
    "hardwareCategory": "Accessories",
    "edition": "Standard"
  },
  {
    "id": "hw-gamecube-controller-adapter",
    "title": "GameCube Controller Adapter",
    "platform": "Nintendo",
    "subtitle": "Nintendo · Accessories",
    "kind": "console",
    "hardwareCategory": "Accessories",
    "edition": "Standard"
  },
  {
    "id": "hw-steam-deck-docking-station",
    "title": "Steam Deck Docking Station",
    "platform": "Valve",
    "subtitle": "Valve · Accessories",
    "kind": "console",
    "hardwareCategory": "Accessories",
    "edition": "Standard"
  },
  {
    "id": "hw-dualsense-charging-station",
    "title": "DualSense Charging Station",
    "platform": "PlayStation",
    "subtitle": "PlayStation · Accessories",
    "kind": "console",
    "hardwareCategory": "Accessories",
    "edition": "Standard"
  },
  {
    "id": "hw-playstation-camera",
    "title": "PlayStation Camera",
    "platform": "PlayStation",
    "subtitle": "PlayStation · Accessories",
    "kind": "console",
    "hardwareCategory": "Accessories",
    "edition": "Standard"
  },
  {
    "id": "hw-playstation-vr2-pc-adapter",
    "title": "PlayStation VR2 PC Adapter",
    "platform": "PlayStation",
    "subtitle": "PlayStation · Accessories",
    "kind": "console",
    "hardwareCategory": "Accessories",
    "edition": "Standard"
  },
  {
    "id": "hw-pulse-3d-wireless-headset",
    "title": "PULSE 3D Wireless Headset",
    "platform": "PlayStation",
    "subtitle": "PlayStation · Accessories",
    "kind": "console",
    "hardwareCategory": "Accessories",
    "edition": "Standard"
  },
  {
    "id": "hw-pulse-elite-wireless-headset",
    "title": "PULSE Elite Wireless Headset",
    "platform": "PlayStation",
    "subtitle": "PlayStation · Accessories",
    "kind": "console",
    "hardwareCategory": "Accessories",
    "edition": "Standard"
  },
  {
    "id": "hw-playstation-5-media-remote",
    "title": "PlayStation 5 Media Remote",
    "platform": "PlayStation",
    "subtitle": "PlayStation · Accessories",
    "kind": "console",
    "hardwareCategory": "Accessories",
    "edition": "Standard"
  },
  {
    "id": "hw-xbox-wireless-adapter-for-windows",
    "title": "Xbox Wireless Adapter for Windows",
    "platform": "Xbox",
    "subtitle": "Xbox · Accessories",
    "kind": "console",
    "hardwareCategory": "Accessories",
    "edition": "Standard"
  },
  {
    "id": "hw-xbox-play-charge-kit",
    "title": "Xbox Play & Charge Kit",
    "platform": "Xbox",
    "subtitle": "Xbox · Accessories",
    "kind": "console",
    "hardwareCategory": "Accessories",
    "edition": "Standard"
  },
  {
    "id": "hw-xbox-wireless-headset",
    "title": "Xbox Wireless Headset",
    "platform": "Xbox",
    "subtitle": "Xbox · Accessories",
    "kind": "console",
    "hardwareCategory": "Accessories",
    "edition": "Standard"
  },
  {
    "id": "hw-g29-driving-force",
    "title": "G29 Driving Force",
    "platform": "Logitech",
    "subtitle": "Logitech · Accessories",
    "kind": "console",
    "hardwareCategory": "Accessories",
    "edition": "Standard"
  },
  {
    "id": "hw-g920-driving-force",
    "title": "G920 Driving Force",
    "platform": "Logitech",
    "subtitle": "Logitech · Accessories",
    "kind": "console",
    "hardwareCategory": "Accessories",
    "edition": "Standard"
  },
  {
    "id": "hw-g923-racing-wheel",
    "title": "G923 Racing Wheel",
    "platform": "Logitech",
    "subtitle": "Logitech · Accessories",
    "kind": "console",
    "hardwareCategory": "Accessories",
    "edition": "Standard"
  }
];
export function hardwareCategory(item:Pick<Item,'kind'|'catalogId'|'hardwareCategory'>):HardwareCategory {
 if(item.kind==='build')return 'PCs';
 return item.hardwareCategory??hardwareCatalog.find(c=>c.id===item.catalogId)?.hardwareCategory??'Consoles';
}
