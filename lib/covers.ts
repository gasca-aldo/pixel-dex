/* Steam publisher-provided cover art; verified September 7, 2026. */
export const covers: Record<string, string> = {
  '1245620':
    'https://cdn.akamai.steamstatic.com/steam/apps/1245620/library_600x900.jpg',
  '1145360':
    'https://cdn.akamai.steamstatic.com/steam/apps/1145360/library_600x900.jpg',
  '367520':
    'https://cdn.akamai.steamstatic.com/steam/apps/367520/library_600x900.jpg',
  '1091500':
    'https://cdn.akamai.steamstatic.com/steam/apps/1091500/library_600x900.jpg',
  '413150':
    'https://cdn.akamai.steamstatic.com/steam/apps/413150/library_600x900.jpg',
  '1174180':
    'https://cdn.akamai.steamstatic.com/steam/apps/1174180/library_600x900.jpg',
  '504230':
    'https://cdn.akamai.steamstatic.com/steam/apps/504230/library_600x900.jpg',
  '1086940':
    'https://cdn.akamai.steamstatic.com/steam/apps/1086940/library_600x900.jpg',
  '1850570':
    'https://cdn.akamai.steamstatic.com/steam/apps/1850570/library_600x900.jpg',
  '632470':
    'https://cdn.akamai.steamstatic.com/steam/apps/632470/library_600x900.jpg',
  '275850':
    'https://cdn.akamai.steamstatic.com/steam/apps/275850/library_600x900.jpg',
  '620':
    'https://cdn.akamai.steamstatic.com/steam/apps/620/library_600x900.jpg',
  '2379780':
    'https://cdn.akamai.steamstatic.com/steam/apps/2379780/library_600x900.jpg',
  '22320':
    'https://cdn.akamai.steamstatic.com/steam/apps/22320/library_600x900.jpg',
  '105600':
    'https://cdn.akamai.steamstatic.com/steam/apps/105600/library_600x900.jpg',
  '1057090':
    'https://cdn.akamai.steamstatic.com/steam/apps/1057090/library_600x900.jpg',
};

export function coverFor(id?:string) {
 if(!id)return undefined;
 return /^igdb:[1-9]\d{0,9}$/.test(id)?'/api/catalog/cover/'+id.slice(5):covers[id];
}

export function coverSrcSet(id?:string) {
 const src=coverFor(id);
 return id?.startsWith('igdb:')&&src?`${src}?dpr=2 2x`:undefined;
}
