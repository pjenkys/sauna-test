# Databáze Saun a Wellness v České republice 🧖‍♂️🧖‍♀️

Moderní komunitní webová aplikace a komplexní databáze saun a wellness center pro Českou republiku s architekturou připravenou na mezinárodní expanzi. Nabízí geolokační doporučení, hloubkovou filtraci (MultiSport podmínky, ochlazovací možnosti, typy saun, privátní zóny), interaktivní mapu, komunitní hodnocení ve stylu ČSFD a etický B2B model pro provozovatele bez předplatného pro návštěvníky.

---

## 🌟 Klíčové funkce

### R1. Objevování a geolokace (Landing Page & Geolocation)
- **Hero sekce**: Vizuální skandinávský wellness motiv s okamžitým vyhledávacím pruhem.
- **Geolokace s fallbackem**: Automatická detekce polohy pomocí Geolocation API prohlížeče (3s timeout) s elegantním manuálním výběrem ze 14 krajských měst ČR uloženým v `localStorage`.
- **Doporučení v okolí**: Dynamický výpočet sférické vzdálenosti (Haversine) s přímým zobrazením 1–3 nejbližších saun včetně vzdálenosti, hodnocení a MultiSport výhody.
- **Rychlé rozcestníky**: 4 hlavní kategorie (*Veřejné sauny*, *Zážitková a ceremoniální wellness*, *Soukromé / privátní sauny*, *Hotelové a horské sauny*).

### R2. Hloubkové vyhledávání a interaktivní mapa
- **MultiSport pravidla do detailu**: Filtrování podle přesných podmínek: 100% vstup zdarma, časově omezený vstup (60, 90, 120 min), sleva na vstup (např. -100 Kč) i doplatky za překročení času (např. 25 Kč / 15 min).
- **Možnosti ochlazení**: Ochlazovací bazének (vnitřní/venkovní), přírodní vodní plocha (Vltava, biotop, jezero), ledová studna/tříšť, polévací vědro, zážitkové sprchy.
- **Typy saun a vybavení**: Finská suchá, biosauna/bylinková, parní lázeň, infrasauna, ceremoniální sál, solná sauna, vířivka/whirlpool, odpočívárny, venkovní zahrady.
- **Provozní režim a pravidla**: Veřejný vstup, privátní pronájem, striktní vs. dobrovolná bezplavková zóna, dámské dny, bezbariérovost, parkování, občerstvení.
- **Inteligentní Zero-State**: Při nulových výsledcích vyhledávač nabízí kontextová doporučení na uvolnění filtrů (např. zrušení filtru bazénku, rozšíření regionu).
- **Interaktivní Leaflet mapa**: Barevně odlišené SVG piny podle kategorií, shlukování (clustering), zlaté orámování a odznaky pro partnery, interaktivní vizitky s proklikem do detailu.

### R3. Komunitní a hodnotící systém (ve stylu ČSFD)
- **Uživatelské účty**: Registrace a přihlášení s bezpečným hashováním hesel (bcrypt) a JWT tokeny, správa profilu.
- **5-kritériální recenze**: Celkové hodnocení 1–5 hvězd + detailní sub-kritéria:
  1. *Čistota prostředí a šaten*
  2. *Kvalita tepla a páry*
  3. *Možnosti ochlazení*
  4. *Personál a saunové ceremoniály*
  5. *Poměr cena / výkon*
- **Slovní tipy a užitečnost**: Užitečné tipy ("jak parkovat", "kdy chodit"), datum návštěvy a hlasování o užitečnosti recenze.
- **Atomický přepočet hodnocení**: Průměrná hodnocení i počty recenzí jsou v databázi přepočítávány atomicky v transakcích.
- **Osobní seznamy**: Tlačítka pro přidání do seznamů *"Oblíbené"*, *"Chci navštívit"* a *"Navštíveno"* s přehledem v profilu uživatele.
- **Komunitní rozšiřování databáze**: Formulář pro návrh nové sauny nebo nahlášení změn s moderátorským workflow (stav `pending` -> `approved`/`rejected`).

### R4. Etická B2B monetizace (Strictly No-Subscription pro návštěvníky)
- **100% zdarma pro návštěvníky**: Žádné paywally, žádné zamčené filtry ani předplatné pro čtení recenzí.
- **Nárokování profilu**: Formulář pro provozovatele s algoritmickým ověřením platnosti českého 8-místného IČO (Modulo-11).
- **Zvýrazněný zápis bez zkreslení hodnocení**: Označení partnerů štítkem *"Doporučeno / Partner"* posouvá zařízení v doporučeném řazení, ale **nikdy nemění, nezvyšuje ani nezkresluje reálné uživatelské hodnocení a recenze**.
- **Kalendář ceremoniálů**: Přehled tematických saunových nocí, rituálů a rozpisů saunérů.
- **Partnerské prokliky**: Odkazy na rezervace a etické affiliate odkazy na saunové vybavení s atributy `rel="noopener noreferrer sponsored"`.

### R5. Architektura databáze a realistický seed
- **Mezinárodní hierarchie**: Struktura `Country > Region > City > Venue` (25 relačních tabulek, cizí klíče, indexy, WAL režim).
- **26 autentických českých saun**: Realistická seed data napříč 11 kraji (Praha, Brno, Ostrava, Plzeň, Liberec, Krkonoše, České Budějovice, Olomouc, Vysočina a další) s reálnými GPS souřadnicemi a pravidly MultiSportu.

---

## 🛠️ Technologický stack

- **Runtime**: Node.js v22+ (testováno na Node.js v24.19.0)
- **Databázový engine**: Nativní vestavěný `node:sqlite` (`DatabaseSync`) v Node.js — nulové externí C++ závislosti, WAL režim, cizí klíče, custom funkce pro Haversine výpočet v SQL
- **Backend**: Express.js, TypeScript, JWT (`jsonwebtoken`), `bcryptjs`
- **Frontend**: React 18, Vite, Tailwind CSS (wellness skandinávská paleta), Lucide React, Leaflet
- **Testovací framework**: Vitest, Supertest (18 testovacích sad, 160 automatických testů, 100% průchodnost)

---

## 🚀 Návod na spuštění

### 1. Prerekvizity
- Nainstalovaný **Node.js v22.5.0 nebo vyšší** (doporučeno v24.x).
- Ve Windows PowerShellu používejte příkazy přes `npm.cmd` / `npx.cmd`.

### 2. Instalace závislostí
Spusťte instalaci závislostí v kořenovém adresáři, serveru i klientu:
```powershell
npm.cmd install
npm.cmd install --prefix shared
npm.cmd install --prefix server
npm.cmd install --prefix client
npm.cmd install --prefix tests
```

### 3. Migrace a naplnění databáze (Seed)
Inicializujte relační databázové schéma (25 tabulek) a naplňte realistická data 26 českých saun:
```powershell
# Vytvoření tabulek
npm.cmd run db:migrate

# Naplnění katalogů a saun
npm.cmd run db:seed
```
*Poznámka: Databázový soubor se vytvoří v `server/data/sauna.db`.*

### 4. Spuštění ve vývojovém režimu (Development)
Pro souběžný běh backendu i frontendu:
```powershell
# Terminál 1 — Backend Express API (port 3001)
npm.cmd run dev --prefix server

# Terminál 2 — Frontend Vite SPA (port 3000)
npm.cmd run dev --prefix client
```
Aplikace je dostupná na: `http://localhost:3000` (požadavky na `/api` jsou automaticky proxyovány na port 3001).

### 5. Sestavení a produkční běh (Production)
```powershell
# 1. Kompletní sestavení (shared types, server TS compilation, client Vite bundle)
npm.cmd run build

# 2. Spuštění produkčního serveru (obsluhuje API i frontend z client/dist na portu 3001)
node server/dist/index.js
# nebo jednoduše:
npm start
```
Aplikace poběží kompletně na: `http://localhost:3001`.

---

## 🧪 Automatizované testy

Projekt obsahuje 4-vrstvou sadu testů (Tiers 1–4) doplněnou o sadu Tier 5 (white-box coverage hardening a adversarial stress testing) a produkční integrační testy životního cyklu aplikace.

Pro spuštění všech 173 testů najednou:
```powershell
npx.cmd vitest run --config tests/vitest.config.ts
```

Struktura testů:
- **Jednotkové testy (Tier 1 & 2)**:
  - `tests/unit/haversine.test.ts` — Přesnost Haversine vzorce (Praha-Brno), 0 km formátování ("0 m"), antipodální souřadnice.
  - `tests/unit/icoValidator.test.ts` — Algoritmus Modulo-11 pro česká IČO (reálné firmy i neplatná čísla).
  - `tests/unit/multisportFee.test.ts` — Výpočet doplatků za časové bloky a slev.
  - `tests/unit/zeroStateRelaxer.test.ts` — Generování doporučení pro uvolnění filtrů při prázdném výsledku.
- **Integrační testy (Tier 1, 2 & 3 + Bootstrap)**:
  - `tests/integration/productionAppBootstrap.test.ts` — 13 testů: bootstrap produkčního serveru na portu 3001, kompatibilita Express 5 bez PathError, obsluha SPA index.html a oddělení od /api 404 handleru.
  - `tests/integration/filterMatrix.test.ts` — Kombinace MultiSport + bazének + typ sauny + bezplavková pravidla.
  - `tests/integration/reviewsRecalc.test.ts` — 5-kritériální recenze a atomický přepočet průměrů.
  - `tests/integration/authWorkflow.test.ts` — Registrace, přihlášení, hashování hesel, JWT middleware.
  - `tests/integration/favoritesList.test.ts` — Přidávání do seznamů Oblíbené/Chci navštívit/Navštíveno, synchronizace počtů.
  - `tests/integration/suggestions.test.ts` — Návrhy nových saun s workflow pro moderátora.
  - `tests/integration/claimsB2B.test.ts` — Nárokování profilu, IČO validace, neměnnost reálného hodnocení.
  - `tests/integration/pairwise.test.ts` — 10 párových kombinací filtrů (MultiSport x ochlazení x vybavení x pravidla).
  - `tests/integration/tier5WhiteboxHardening.test.ts` — 59 testů pokrývajících hraniční stavy serveru, vyhledávání a řazení.
- **Adversariální testy (Tier 5)**:
  - `tests/adversarial/adversarialStress.test.ts` — SQL injection útoky, XSS skripty, konkurence zápisů.
- **Scénáře uživatelských cest (Tier 4 Persona E2E)**:
  - `tests/e2e/commuterJourney.test.ts` — Petr (dojíždějící s MultiSport kartou).
  - `tests/e2e/reviewerJourney.test.ts` — Lenka (milovnice ceremoniálů píšící recenzi).
  - `tests/e2e/communityJourney.test.ts` — David (návrh nové sauny do databáze).
  - `tests/e2e/operatorJourney.test.ts` — Ing. Marek (nárokování profilu provozovatelem).
  - `tests/e2e/roadtripperJourney.test.ts` — Alena (výběr kraje bez GPS, affiliate vybavení).

Všechny testy běží proti izolované databázi v paměti (`:memory:`) v řádu několika sekund.
