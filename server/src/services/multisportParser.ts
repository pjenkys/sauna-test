import type { MultiSportRawFacilityDetail } from './multisportClient.js';

export interface ParsedMultiSportVenue {
  id: string;
  multisportId: number;
  name: string;
  slug: string;
  category: 'public' | 'wellness_ceremonial' | 'private' | 'hotel_mountain';
  shortDescription: string;
  description: string;
  addressStreet: string;
  addressCity: string;
  addressZip: string;
  latitude: number;
  longitude: number;
  cityId: string;
  regionId: string;
  countryId: string;
  phone: string | null;
  email: string | null;
  websiteUrl: string | null;
  coverImageUrl: string;
  galleryUrls: string[];
  
  // Features
  hasPlungePool: boolean;
  hasOutdoorCooling: boolean;
  hasNaturalWater: boolean;
  hasWhirlpool: boolean;
  hasSteamBath: boolean;
  hasHerbalSauna: boolean;
  hasCeremonialHall: boolean;

  // MultiSport Rules
  multisportRule: {
    isAccepted: boolean;
    benefitType: 'free_unlimited' | 'free_time_limited' | 'entry_discount' | 'surcharge_entry';
    timeLimitMinutes: number | null;
    entrySurchargeCzk: number | null;
    includedZones: string;
    acceptedCardTypes: string[];
    note: string | null;
  };
}

// 14 Czech Regions with representative center coordinates
const CZECH_REGIONS = [
  { id: 'cz-pha', name: 'Praha', lat: 50.0755, lon: 14.4378, cities: ['praha', 'prague'] },
  { id: 'cz-stc', name: 'Středočeský kraj', lat: 49.95, lon: 14.8, cities: ['kladno', 'mladá boleslav', 'příbram', 'kolín', 'kutná hora', 'benešov', 'beroun', 'mělník', 'nymburk', 'říčany', 'brandýs', 'čelákovice', 'poděbrady', 'slané'] },
  { id: 'cz-jhm', name: 'Jihomoravský kraj', lat: 49.1951, lon: 16.6068, cities: ['brno', 'znojmo', 'hodonín', 'břeclav', 'vyškov', 'blansko', 'kuřim', 'boskovice', 'tišnov'] },
  { id: 'cz-msk', name: 'Moravskoslezský kraj', lat: 49.8209, lon: 18.2625, cities: ['ostrava', 'havířov', 'opava', 'frýdek-místek', 'karviná', 'třinec', 'nový jičín', 'krnov', 'kopřivnice', 'bohumín'] },
  { id: 'cz-plk', name: 'Plzeňský kraj', lat: 49.7475, lon: 13.3776, cities: ['plzeň', 'klatovy', 'rokycany', 'tomašov', 'domažlice', 'tachov', 'sušice'] },
  { id: 'cz-jhc', name: 'Jihočeský kraj', lat: 48.9745, lon: 14.4743, cities: ['české budějovice', 'tábor', 'písek', 'strakonice', 'jindřichův hradec', 'český krumlov', 'prachatice'] },
  { id: 'cz-ulk', name: 'Ústecký kraj', lat: 50.6607, lon: 14.0323, cities: ['ústí nad labem', 'most', 'teplice', 'děčín', 'chomutov', 'litoměřice', 'louny', 'žatec', 'krupka', 'roudnice'] },
  { id: 'cz-hkk', name: 'Královéhradecký kraj', lat: 50.2104, lon: 15.8252, cities: ['hradec králové', 'trutnov', 'náchod', 'jičín', 'dvůr králové', 'vrchlabí', 'špindlerův mlýn', 'pec pod sněžkou'] },
  { id: 'cz-pak', name: 'Pardubický kraj', lat: 50.0343, lon: 15.7812, cities: ['pardubice', 'chrudim', 'svitavy', 'česká třebová', 'ústí nad orlicí', 'litomyšl', 'lanškroun'] },
  { id: 'cz-olk', name: 'Olomoucký kraj', lat: 49.5938, lon: 17.2509, cities: ['olomouc', 'prostějov', 'přerov', 'šumperk', 'hranice', 'zábřeh', 'jeseník', 'šternberk', 'mohelnice'] },
  { id: 'cz-zlk', name: 'Zlínský kraj', lat: 49.2243, lon: 17.6627, cities: ['zlín', 'kroměříž', 'uherské hradiště', 'vsetín', 'valašské meziříčí', 'otrokovice', 'rožnov pod radhoštěm', 'uherský brod', 'luhačovice'] },
  { id: 'cz-vys', name: 'Kraj Vysočina', lat: 49.3961, lon: 15.5912, cities: ['jihlava', 'třebíč', 'havlíčkův brod', 'žďár nad sázavou', 'pelhřimov', 'velké meziříčí', 'humpolec', 'nové město na moravě'] },
  { id: 'cz-lbk', name: 'Liberecký kraj', lat: 50.7671, lon: 15.0562, cities: ['liberec', 'jablonec nad nisou', 'česká lípa', 'turnov', 'nový bor', 'semily', 'harrahov', 'rokytnice'] },
  { id: 'cz-kvk', name: 'Karlovarský kraj', lat: 50.2319, lon: 12.8719, cities: ['karlovy vary', 'cheb', 'sokolov', 'ostrov', 'aš', 'mariánské lázně', 'františkovy lázně'] },
];

function cleanCzechSlug(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  return 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function resolveRegionId(lat: number, lon: number, cityName?: string | null): string {
  if (cityName) {
    const normCity = cityName.toLowerCase().trim();
    for (const reg of CZECH_REGIONS) {
      if (reg.cities.some((c) => normCity.includes(c))) {
        return reg.id;
      }
    }
  }

  // Fallback to closest region centroid
  let closestRegion = CZECH_REGIONS[0].id;
  let minDistance = Infinity;

  for (const reg of CZECH_REGIONS) {
    const dist = calculateDistance(lat, lon, reg.lat, reg.lon);
    if (dist < minDistance) {
      minDistance = dist;
      closestRegion = reg.id;
    }
  }

  return closestRegion;
}

export function parseMultiSportRules(props: MultiSportRawFacilityDetail['properties']): {
  isAccepted: boolean;
  benefitType: 'free_unlimited' | 'free_time_limited' | 'entry_discount' | 'surcharge_entry';
  timeLimitMinutes: number | null;
  entrySurchargeCzk: number | null;
  includedZones: string;
  acceptedCardTypes: string[];
  note: string | null;
} {
  const summary = `${props.activity_summary || ''} ${props.additional_payment_desc || ''}`.trim();
  const lower = summary.toLowerCase();

  // 1. Time limit: prioritize sauna-specific time limit (e.g. "Sauna (120 min)", "Sauna 90 min")
  let timeLimitMinutes: number | null = null;
  const saunaTimeMatch = lower.match(/saun[a-z]*[^\d\n\r]{0,25}(\d+)\s*min/i);
  if (saunaTimeMatch) {
    const val = parseInt(saunaTimeMatch[1], 10);
    if (!isNaN(val) && val >= 30 && val <= 360) {
      timeLimitMinutes = val;
    }
  }
  if (timeLimitMinutes == null) {
    const timeMatch = lower.match(/\b(45|60|75|90|120|150|180)\s*min/i);
    if (timeMatch) {
      timeLimitMinutes = parseInt(timeMatch[1], 10);
    }
  }

  // 2. Surcharge / Doplatek: e.g. "doplatek 60 Kč", "doplatkem 120 CZK", "CZK 120", "surcharge 60"
  let entrySurchargeCzk: number | null = null;
  const surchargeMatch =
    lower.match(/doplat(?:kem|ek)[^\d]*(\d+)\s*(?:kč|czk)?/i) ||
    lower.match(/(\d+)\s*(?:kč|czk)[^\d]*doplat/i) ||
    lower.match(/(?:czk|kč)\s*(\d+)/i) ||
    lower.match(/surcharge[^\d]*(\d+)/i);

  if (surchargeMatch) {
    const val = parseInt(surchargeMatch[1], 10);
    if (!isNaN(val) && val > 0 && val < 2000) {
      entrySurchargeCzk = val;
    }
  }

  // 3. Benefit type
  let benefitType: 'free_unlimited' | 'free_time_limited' | 'entry_discount' | 'surcharge_entry' =
    'free_unlimited';

  if (entrySurchargeCzk != null && entrySurchargeCzk > 0) {
    benefitType = 'surcharge_entry';
  } else if (props.additional_payment === true) {
    benefitType = 'surcharge_entry';
  } else if (timeLimitMinutes != null) {
    benefitType = 'free_time_limited';
  }

  // 4. Accepted card types
  const acceptedCardTypes: string[] = [];
  if (props.active_cards?.visible && Array.isArray(props.active_cards.visible)) {
    for (const card of props.active_cards.visible) {
      if (card.name && !acceptedCardTypes.includes(card.name)) {
        acceptedCardTypes.push(card.name);
      }
    }
  }
  if (acceptedCardTypes.length === 0) {
    acceptedCardTypes.push('Stříbrná', 'Dítě');
  }

  return {
    isAccepted: true,
    benefitType,
    timeLimitMinutes,
    entrySurchargeCzk,
    includedZones: 'Sauna a wellness zóna',
    acceptedCardTypes,
    note: summary || null,
  };
}

export function parseMultiSportVenue(raw: MultiSportRawFacilityDetail): ParsedMultiSportVenue {
  const props = raw.properties || ({} as any);
  const coords = raw.geometry?.coordinates || [14.4378, 50.0755];
  const lon = Number(coords[0]);
  const lat = Number(coords[1]);

  const name = (props.name || 'Sauna MultiSport').trim();
  const rawCity = (props.city || 'Česká republika').trim();
  const addressStreet = [props.street, props.number].filter(Boolean).join(' ').trim() || rawCity;
  const addressZip = '000 00'; // Default placeholder if not provided

  const regionId = resolveRegionId(lat, lon, rawCity);
  const citySlug = cleanCzechSlug(rawCity) || 'mesto';
  const cityId = `${regionId}-${citySlug}`;

  const slug = cleanCzechSlug(`${name}-${rawCity}-${raw.id}`);
  const venueId = `ms-${raw.id}`;

  const fallbackPhotoPool = [
    '1660735698223-23a4edefa264',
    '1712659604528-b179a3634560',
    '1692985159902-50c672483c31',
    '1713270176378-45fbf4a27099',
    '1604609165678-096d20fab1ad',
    '1739869481946-c054e37a55b1',
    '1583416750470-965b2707b355',
    '1531875456634-3f5418280d20',
    '1545205597-3d9d02c29597',
    '1584132967334-10e028bd69f7',
    '1586105251261-72a756497a11',
    '1576013551627-0cc20b96c2a7',
    '1563911302283-d2bc129e7570',
    '1544161515-4ab6ce6db874',
    '1600585154340-be6161a56a0c',
    '1515377905703-c4788e51af15',
    '1507089947368-19c1da9775ae',
    '1590490360182-c33d57733427',
    '1519710164239-da123dc03ef4',
    '1584622650111-993a426fbf0a',
    '1571003123894-1f0594d2b5d9',
    '1560448204-e02f11c3d0e2',
    '1508214751196-bcfd4ca60f91',
    '1566073771259-6a8506099945',
    '1540497077202-7c8a3999166f',
    '1582719478250-c89cae4dc85b',
    '1600334089648-b0d9d3028eb2',
    '1507652313519-d4e9174996dd',
    '1570172619644-dfd03ed5d881',
    '1476514525535-07fb3b4ae5f1',
  ];
  const photoIndex = Math.abs((Number(raw.id) || 0) + (rawCity ? rawCity.length : 0)) % fallbackPhotoPool.length;
  const fallbackImg = `https://images.unsplash.com/photo-${fallbackPhotoPool[photoIndex]}?auto=format&fit=crop&w=1200&q=80`;

  // Image resolving
  const coverImageUrl =
    props.main_image?.thumbnail_800_600 ||
    props.main_image?.thumbnail_400_300 ||
    fallbackImg;

  const galleryUrls: string[] = [];
  if (props.galery_images && Array.isArray(props.galery_images)) {
    for (const img of props.galery_images) {
      const u = img.thumbnail_800_600 || img.url;
      if (u && !galleryUrls.includes(u)) {
        galleryUrls.push(u);
      }
    }
  }

  // Feature detection
  const activityNames = (props.activity || []).map((a) => a.name.toLowerCase());
  const summaryLower = `${props.activity_summary || ''} ${props.description || ''}`.toLowerCase();

  const hasPlungePool =
    activityNames.some((a) => a.includes('bazén') || a.includes('swimming') || a.includes('aquapark')) ||
    summaryLower.includes('bazén') ||
    summaryLower.includes('ochlazov');

  const hasWhirlpool =
    activityNames.some((a) => a.includes('whirlpool') || a.includes('vířivk')) ||
    summaryLower.includes('whirlpool') ||
    summaryLower.includes('vířivk');

  const hasSteamBath =
    activityNames.some((a) => a.includes('pára') || a.includes('steam')) ||
    summaryLower.includes('pára') ||
    summaryLower.includes('parní');

  const hasOutdoorCooling =
    activityNames.some((a) => a.includes('letní') || a.includes('biotope') || a.includes('koupaliště')) ||
    summaryLower.includes('venkovní') ||
    summaryLower.includes('jezírko');

  const hasNaturalWater =
    activityNames.some((a) => a.includes('biotope') || a.includes('řeka') || a.includes('přírodní')) ||
    summaryLower.includes('biotop') ||
    summaryLower.includes('řeka') ||
    summaryLower.includes('přírodní voda');

  const hasCeremonialHall =
    summaryLower.includes('ceremoniál') ||
    summaryLower.includes('rituál') ||
    summaryLower.includes('saunér');

  const hasHerbalSauna =
    summaryLower.includes('bylin') || summaryLower.includes('aroma') || summaryLower.includes('bio');

  // Category determination
  let category: 'public' | 'wellness_ceremonial' | 'private' | 'hotel_mountain' = 'public';
  if (hasCeremonialHall || name.toLowerCase().includes('infinit') || name.toLowerCase().includes('saunia')) {
    category = 'wellness_ceremonial';
  } else if (name.toLowerCase().includes('hotel') || summaryLower.includes('hotel') || summaryLower.includes('horsk')) {
    category = 'hotel_mountain';
  } else if (name.toLowerCase().includes('privátní') || summaryLower.includes('privátní')) {
    category = 'private';
  }

  const shortDescription =
    props.description
      ? props.description.replace(/<[^>]+>/g, '').slice(0, 300).trim()
      : `${name} — příjemné saunové a relaxační zázemí ve městě ${rawCity} s podporou karty MultiSport.`;

  const description =
    props.description && props.description.length > 50
      ? props.description
      : `<p>${name} nabízí skvělé podmínky pro regeneraci těla i mysli. K dispozici je saunová zóna s možností ochlazení a relaxace v klidném prostředí.</p>`;

  const multisportRule = parseMultiSportRules(props);

  return {
    id: venueId,
    multisportId: raw.id,
    name,
    slug,
    category,
    shortDescription,
    description,
    addressStreet,
    addressCity: rawCity,
    addressZip,
    latitude: lat,
    longitude: lon,
    cityId,
    regionId,
    countryId: 'CZ',
    phone: props.phone || null,
    email: props.email || null,
    websiteUrl: props.website_url || null,
    coverImageUrl,
    galleryUrls,
    hasPlungePool,
    hasOutdoorCooling,
    hasNaturalWater,
    hasWhirlpool,
    hasSteamBath,
    hasHerbalSauna,
    hasCeremonialHall,
    multisportRule,
  };
}
