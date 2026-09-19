# Original User Request

## Initial Request — 2026-09-16T15:00:00Z

Vytvořit komplexní, moderní webovou aplikaci a komunitní databázi saun a wellness center pro Českou republiku (s architektonickou připraveností na mezinárodní expanzi), nabízející geolokační doporučení, hloubkovou filtraci (MultiSport podmínky, ochlazovací bazénky, typy saun, privátní zóny), interaktivní mapu, komunitní hodnocení ve stylu ČSFD/Databáze knih a etický B2B monetizační model bez předplatného.

Working directory: C:/Users/user/sauna_database
Integrity mode: development

## Requirements

### R1. Objevování a vizuální prezentace (Landing Page & Geolocation)
- Hlavní stránka (Hero sekce) s lákavým vizuálním motivem saunování a okamžitým vyhledávacím pruhem.
- Geolokační modul detekující polohu uživatele (s možností manuálního výběru města/kraje), který na hlavní stránce dynamicky prezentuje 1–3 nejlepší tipy na sauny v okolí s údajem o vzdálenosti, hodnocení a dostupnosti.
- Rychlé rozcestníky hlavních kategorií: Veřejné sauny, Zážitková a ceremoniální wellness, Soukromé / privátní sauny, Hotelové a horské sauny.

### R2. Hloubkové vyhledávání a interaktivní mapa
- Vyhledávací a filtrační systém s okamžitou odezvou podporující kombinaci parametrů:
  - **MultiSport karta s přesnými pravidly**: 100% vstup zdarma, časově omezený vstup (např. 60 min, 90 min), sleva na vstup (např. 100 Kč sleva), případně doplatek za překročení.
  - **Ochlazení**: ochlazovací bazének (vnitřní/venkovní), přírodní vodní plocha (jezero, řeka, biotop), ledová studna/tříšť, polévací vědro, zážitkové sprchy.
  - **Typy a vybavení saun**: finská / suchá, biosauna / bylinková, parní lázeň, infrasauna, ceremoniální sál, solná sauna, vířivka / whirlpool, relaxační místnosti, venkovní zahrada.
  - **Provozní režim**: veřejný vstup, možnost privátního pronájmu, čistě soukromá sauna, bezplavková zóna (striktní / dobrovolná), dámské dny, bezbariérový přístup, parkování, občerstvení.
- Interaktivní mapa (s možností zobrazení celé ČR i regionů) integrující piny s barevným odlišením kategorií, shlukováním (clustering) a vyskakovacími vizitkami (rychlý náhled, otevírací doba, hodnocení).

### R3. Komunitní a hodnotící systém (ve stylu ČSFD / Databáze knih)
- Uživatelské účty: registrace, přihlášení, správa uživatelského profilu a veřejná stránka profilu.
- Vícekriteriální recenze: celkové hodnocení (např. 1–5 hvězd / procenta) a dílčí hodnocení parametrů (čistota, kvalita tepla a páry, možnosti ochlazení, personál & saunové ceremoniály, poměr cena/výkon).
- Slovní komentáře, uživatelské tipy (např. "nejlepší čas k návštěvě", "jak se tam parkuje") a možnost přidávání vlastních fotografií.
- Ukládání saun do osobních seznamů: "Oblíbené", "Chci navštívit" a "Navštíveno".
- Komunitní rozšiřování databáze: formulář pro návrh nové sauny nebo nahlášení neaktuálních informací s workflow pro moderátora / administrátora.

### R4. Monetizační model pro provozovatele (Strictly No-Subscription for Visitors)
- Nulové poplatky pro návštěvníky (všechny informace, filtry i recenze jsou 100% zdarma bez placených paywallů).
- B2B funkce pro provozovatele a provozní partnery:
  - Možnost "Nárokovat profil sauny" provozovatelem s ověřením.
  - Zvýrazněný zápis / propagovaný tip (Promoted placement na domovské stránce a v mapě bez zkreslení uživatelského hodnocení).
  - Kalendář saunových ceremoniálů a speciálních akcí (provozovatelé mohou propagovat tématické saunové noci).
  - Partnerské prokliky: přímé odkazy na rezervační systémy provozovatelů a affiliate partnerství s e-shopy se saunovým vybavením (saunové čepice, esenciální oleje, kilty).

### R5. Architektura databáze a škálovatelnost
- Datový model připravený pro mezinárodní rozšíření (lokalizované položky, struktura stát > kraj/region > město > provozovna).
- Seed dataset obsahující realistická data pro desítky reprezentativních saun napříč celou ČR (Praha, Brno, Ostrava, Plzeň, Liberec, Krkonoše a další), včetně reálných parametrů MultiSportu a typů vybavení.

## Acceptance Criteria

### Funkčnost vyhledávače a filtrů
- [ ] Vyhledávací filtr umožňuje filtrovat současně podle: MultiSport podmínek (plně zdarma vs. časový limit vs. sleva), přítomnosti ochlazovacího bazénku a typu sauny.
- [ ] Filtrování vrací přesné výsledky a správně reaguje na prázdné výsledky (zero-state zpráva s doporučením uvolnit filtry).

### Geolokace a mapa
- [ ] Na hlavní stránce funguje geolokační výpočet vzdálenosti od uživatele (pomocí Geolocation API prohlížeče nebo manuálně vybrané lokace v ČR) a zobrazuje 1–3 nejbližší doporučené sauny.
- [ ] Interaktivní mapa zobrazuje všechny sauny v databázi s odpovídajícími GPS souřadnicemi a umožňuje filtrování přímo nad mapou.

### Komunitní funkce a profil sauny
- [ ] Detail sauny zobrazuje kompletní parametry (otevírací dobu, ceník, MultiSport podmínky, typy saun, fotogalerii a mapku).
- [ ] Uživatel se může zaregistrovat, přihlásit a napsat recenzi s textem a vícedimenzionálním hodnocením.
- [ ] Průměrné hodnocení a počet recenzí sauny se automaticky přepočítávají po přidání nové recenze.
- [ ] Uživatel může saunu jedním kliknutím přidat/odebrat ze svých "Oblíbených" a seznam vidí ve svém profilu.
- [ ] Uživatel může odeslat formulář "Přidat saunu do databáze", který se uloží do systému se stavem čekající na schválení.

### B2B a monetizace
- [ ] V detailu sauny je funkční tlačítko / formulář "Jste provozovatel? Nárokujte si tento profil".
- [ ] Vyhledávání a mapa vizuálně rozlišují zvýrazněné / propagované sauny štítkem "Doporučeno / Partner", přičemž reálné uživatelské hodnocení zůstává transparentní a neměnné.

### Spolehlivost, automatizované testy a spuštění
- [ ] Automatizované testy ověřují: filtrovací logiku (zejména kombinace MultiSport + bazének), výpočet vzdáleností a proces přidání recenze a oblíbených.
- [ ] Aplikace obsahuje kompletní návod na spuštění a skripty (např. pro migraci/seed databáze, vývojový i produkční běh).
