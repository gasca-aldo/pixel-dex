// Curated variants. Color combinations describe the hardware, not a paint specification.
// Sources checked September 2026: Nintendo Switch OLED FAQ and product pages;
// Xbox Wire, 2024-08-21 and 2024-11-15; Commons file descriptions below.
export type HardwarePhoto = {src:string;source:string;author:string;license:string;licenseUrl:string};
export type HardwareVariant = {label:string;edition:string;color:string;photo?:string};
export const hardwarePhotos:Record<string,HardwarePhoto> = {
  "oled-white": {
    "src": "/hardware/oled-white.jpg",
    "source": "https://commons.wikimedia.org/wiki/File:Nintendo_Switch_OLED_model_%28white%29.jpg",
    "author": "Evan0512; derivative by Verdel",
    "license": "CC BY-SA 4.0",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0/"
  },
  "oled-zelda": {
    "src": "/hardware/oled-zelda.jpg",
    "source": "https://commons.wikimedia.org/wiki/File:Nintendo_Switch_%E2%80%93_OLED-Modell_%28The_Legend_of_Zelda_-_Tears_of_the_Kingdom%29_20230510_HOF02399_RAW-Export.png",
    "author": "PantheraLeo1359531",
    "license": "CC BY 4.0",
    "licenseUrl": "https://creativecommons.org/licenses/by/4.0/"
  },
  "ps5-white": {
    "src": "/hardware/ps5-white.png",
    "source": "https://commons.wikimedia.org/wiki/File:PlayStation_5_and_DualSense_with_transparent_background.png",
    "author": "Osh33m; background removed by Soberian",
    "license": "CC BY-SA 4.0",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0/"
  },
  "series-x-black": {
    "src": "/hardware/series-x-black.jpg",
    "source": "https://commons.wikimedia.org/wiki/File:Xbox_Series_X_2.jpg",
    "author": "Der. Bellemer",
    "license": "CC BY-SA 4.0",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0/"
  },
  "nes": {
    "src": "/hardware/nes.jpg",
    "source": "https://commons.wikimedia.org/wiki/File:NES-Console-Set.jpg",
    "author": "Evan-Amos",
    "license": "Public domain",
    "licenseUrl": "https://commons.wikimedia.org/wiki/File:NES-Console-Set.jpg#Licensing"
  },
  "snes": {
    "src": "/hardware/snes.jpg",
    "source": "https://commons.wikimedia.org/wiki/File:SNES-Mod1-Console-Set.jpg",
    "author": "Evan-Amos",
    "license": "Public domain",
    "licenseUrl": "https://commons.wikimedia.org/wiki/File:SNES-Mod1-Console-Set.jpg#Licensing"
  },
  "n64": {
    "src": "/hardware/n64.jpg",
    "source": "https://commons.wikimedia.org/wiki/File:N64-Console-Set.jpg",
    "author": "Evan-Amos",
    "license": "Public domain",
    "licenseUrl": "https://commons.wikimedia.org/wiki/File:N64-Console-Set.jpg#Licensing"
  },
  "gamecube": {
    "src": "/hardware/gamecube.jpg",
    "source": "https://commons.wikimedia.org/wiki/File:GameCube-Set.jpg",
    "author": "Evan-Amos",
    "license": "Public domain",
    "licenseUrl": "https://commons.wikimedia.org/wiki/File:GameCube-Set.jpg#Licensing"
  },
  "wii": {
    "src": "/hardware/wii.jpg",
    "source": "https://commons.wikimedia.org/wiki/File:Wii-console.jpg",
    "author": "Evan-Amos",
    "license": "Public domain",
    "licenseUrl": "https://commons.wikimedia.org/wiki/File:Wii-console.jpg#Licensing"
  }
};
export const hardwareVariants:Record<string,HardwareVariant[]> = {
  "switch-oled": [
    {
      "label": "White",
      "edition": "Standard",
      "color": "White",
      "photo": "oled-white"
    },
    {
      "label": "Neon Blue / Neon Red",
      "edition": "Standard",
      "color": "Neon Blue / Neon Red"
    },
    {
      "label": "Zelda: Tears of the Kingdom Edition",
      "edition": "The Legend of Zelda: Tears of the Kingdom Edition",
      "color": "Gold / White / Green",
      "photo": "oled-zelda"
    },
    {
      "label": "Mario Red Edition",
      "edition": "Mario Red Edition",
      "color": "Mario Red"
    },
    {
      "label": "Splatoon 3 Edition",
      "edition": "Splatoon 3 Edition",
      "color": "Blue-purple / Yellow-green"
    }
  ],
  "switch-lite": [
    {
      "label": "Turquoise",
      "edition": "Standard",
      "color": "Turquoise"
    },
    {
      "label": "Yellow",
      "edition": "Standard",
      "color": "Yellow"
    },
    {
      "label": "Gray",
      "edition": "Standard",
      "color": "Gray"
    },
    {
      "label": "Coral",
      "edition": "Standard",
      "color": "Coral"
    },
    {
      "label": "Blue",
      "edition": "Standard",
      "color": "Blue"
    },
    {
      "label": "Hyrule Edition",
      "edition": "Hyrule Edition",
      "color": "Gold / Black"
    }
  ],
  "hw-nintendo-switch": [
    {
      "label": "Neon Blue / Neon Red",
      "edition": "Standard",
      "color": "Neon Blue / Neon Red"
    },
    {
      "label": "Gray",
      "edition": "Standard",
      "color": "Gray"
    }
  ],
  "ps5": [
    {
      "label": "Original disc edition \u2014 White",
      "edition": "Standard",
      "color": "White",
      "photo": "ps5-white"
    }
  ],
  "series-x": [
    {
      "label": "1 TB \u2014 Carbon Black",
      "edition": "1 TB disc edition",
      "color": "Carbon Black",
      "photo": "series-x-black"
    },
    {
      "label": "1 TB Digital Edition \u2014 Robot White",
      "edition": "1 TB Digital Edition",
      "color": "Robot White"
    },
    {
      "label": "2 TB Galaxy Black Special Edition",
      "edition": "2 TB Galaxy Black Special Edition",
      "color": "Galaxy Black"
    }
  ],
  "series-s": [
    {
      "label": "512 GB \u2014 Robot White",
      "edition": "512 GB",
      "color": "Robot White"
    },
    {
      "label": "1 TB \u2014 Robot White",
      "edition": "1 TB",
      "color": "Robot White"
    },
    {
      "label": "1 TB \u2014 Carbon Black",
      "edition": "1 TB",
      "color": "Carbon Black"
    }
  ],
  "hw-nintendo-entertainment-system": [
    {
      "label": "Original \u2014 Gray",
      "edition": "Standard",
      "color": "Gray",
      "photo": "nes"
    }
  ],
  "hw-super-nintendo-entertainment-system": [
    {
      "label": "North American model \u2014 Gray / Purple",
      "edition": "North American model",
      "color": "Gray / Purple",
      "photo": "snes"
    }
  ],
  "hw-nintendo-64": [
    {
      "label": "Charcoal Gray",
      "edition": "Standard",
      "color": "Charcoal Gray",
      "photo": "n64"
    }
  ],
  "hw-nintendo-gamecube": [
    {
      "label": "Indigo",
      "edition": "Standard",
      "color": "Indigo",
      "photo": "gamecube"
    }
  ],
  "hw-nintendo-wii": [
    {
      "label": "White",
      "edition": "Standard",
      "color": "White",
      "photo": "wii"
    }
  ]
};
export function variantsFor(id?:string):HardwareVariant[] { return id ? hardwareVariants[id]??[] : []; }
type VariantItem={catalogId?:string;edition?:string;color?:string};
export function variantFor(item:VariantItem) {
 const variants=variantsFor(item.catalogId);
 // Catalog previews have no saved details; existing user records must match exactly.
 if(item.edition===undefined && item.color===undefined)return variants[0];
 return variants.find(v=>v.edition===item.edition && v.color===item.color);
}
export function hardwarePhotoFor(item:VariantItem) {
 const variant=variantFor(item);return variant?.photo?hardwarePhotos[variant.photo]:undefined;
}
export function selectHardwareVariant<T extends VariantItem>(item:T,label:string):T {
 const variant=variantsFor(item.catalogId).find(v=>v.label===label);
 return variant?{...item,edition:variant.edition,color:variant.color}:{...item,edition:'Custom',color:''};
}
