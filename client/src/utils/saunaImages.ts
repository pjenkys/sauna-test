export const CURATED_SAUNA_PHOTOS = [
  '1660735698223-23a4edefa264', // Maximus lake & outdoor wellness
  '1712659604528-b179a3634560', // Saunaspot riverside sauna
  '1692985159902-50c672483c31', // Infinit Step ceremonial sauna
  '1713270176378-45fbf4a27099', // Nordic cabin lake sauna
  '1604609165678-096d20fab1ad', // Jeseniky mountain wellness
  '1739869481946-c054e37a55b1', // Aufguss ceremonial ritual
  '1583416750470-965b2707b355', // Modern Finnish cedar sauna
  '1531875456634-3f5418280d20', // Rustic sauna with lava rocks
  '1545205597-3d9d02c29597', // Spacious wooden sauna benches
  '1584132967334-10e028bd69f7', // Roman thermal spa bath
  '1586105251261-72a756497a11', // Mountain forest timber cabin
  '1576013551627-0cc20b96c2a7', // Large wellness pool & saunas
  '1563911302283-d2bc129e7570', // Thermal outdoor resort
  '1544161515-4ab6ce6db874', // Nature wellness sanctuary
  '1600585154340-be6161a56a0c', // Stone cold plunge pool
  '1515377905703-c4788e51af15', // Warm wellness lounge
  '1507089947368-19c1da9775ae', // Clean architectural timber sauna
  '1590490360182-c33d57733427', // Panoramic glass sauna
  '1519710164239-da123dc03ef4', // Forest thermal spa
  '1584622650111-993a426fbf0a', // Scandinavian plunge bath
  '1571003123894-1f0594d2b5d9', // Aquapark wellness world
  '1560448204-e02f11c3d0e2', // Modern sauna room
  '1508214751196-bcfd4ca60f91', // Wooden barrel bath & spa
  '1566073771259-6a8506099945', // Alpine golf resort wellness
  '1540497077202-7c8a3999166f', // Sport recovery sauna
  '1582719478250-c89cae4dc85b', // Private suite sauna
  '1600334089648-b0d9d3028eb2', // Pine forest barrel sauna
  '1507652313519-d4e9174996dd', // Mountain infinity pool
  '1570172619644-dfd03ed5d881', // Herbal bio sauna
  '1476514525535-07fb3b4ae5f1', // Lake sauna dock
];

/**
 * Returns a high-resolution, unique Unsplash photo URL from the curated pool
 * based on a deterministic hash of the sauna id or name.
 */
export function getDiverseSaunaPhoto(identifier: string | number, width = 800): string {
  const str = String(identifier || 'sauna');
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % CURATED_SAUNA_PHOTOS.length;
  const id = CURATED_SAUNA_PHOTOS[index];
  return `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${width}&q=80`;
}
